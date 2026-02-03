import express from "express"
import cors from 'cors'
import { config } from "dotenv"
config();
import { Server } from "socket.io"
import http from "http";
import { router } from "./utilities/routes";
import { query } from "./utilities/database";
import { teamRouter } from "./utilities/teamRoutes";
import { analyticsRouter } from './utilities/analyticsRoutes';

import { sendEmail } from './utilities/emailService';
import { commentsRouter } from './utilities/commentsRoutes';

const app = express();

const FRONTEND_ORIGIN = process.env.VITE_WEBSITE || 'http://localhost:5173';


// Add COOP policy headers to allow Firebase popup
app.use((_req, res, next) => {
    res.header('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
});

app.use(cors({
    origin: [FRONTEND_ORIGIN],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}
))
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: FRONTEND_ORIGIN,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
})
const socketEmailMapping = new Map<string, string>();
io.on("connection", (socket) => {
    let currEmail = "";
    socket.on("createMapping", (email) => {
        socketEmailMapping.set(email, socket.id);
        currEmail = email;
    })
    socket.on("chat", async ({ from, to, message, chatId, requestEditor }: { from: string, to: string, message: string, chatId: string, requestEditor: string }) => {
        const targetId = socketEmailMapping.get(to);
        if (targetId) {
            socket.to(targetId).emit("chat", { from, message });
        } else {
            // 🆕 User offline, send email
            sendEmail('newMessage', {
                toEmail: to,
                fromEmail: from,
                message: message.substring(0, 100) // Truncate long messages
            });
        }
        if (requestEditor) {
            try {
                await query(
                    'INSERT INTO creator_requests (editor_email, creator_email, notify) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                    [to, from, true]
                );
            } catch (err) {
                console.log("error occurred while saving to creator_requests table", err)
            }
        }
        try {
            await query(
                'INSERT INTO chats (chat_id, "from", "to", message) VALUES ($1, $2, $3, $4)',
                [chatId, from, to, message]
            );
        } catch (err) {
            console.log("error occurred while saving chats", err)
        }
    })
    socket.on("disconnect", () => {
        if (currEmail !== "" && socketEmailMapping.get(currEmail)) {
            socketEmailMapping.delete(currEmail);
        }
    })
})
app.use(express.json(), (_err: express.Errback, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(406).send("Invalid")
});

app.use(router)

app.use(teamRouter);

app.use(analyticsRouter);

app.use(commentsRouter);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
})