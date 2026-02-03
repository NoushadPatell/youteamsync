// backend/utilities/emailService.ts (CREATE NEW FILE)
import nodemailer from 'nodemailer';

// Create transporter (using Gmail - free)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // your-email@gmail.com
        pass: process.env.EMAIL_APP_PASSWORD // App-specific password
    }
});

// Email templates
const emailTemplates = {
    taskAssigned: (data: { editorEmail: string; creatorEmail: string; videoTitle: string; role: string; notes?: string }) => ({
        to: data.editorEmail,
        subject: `🎬 New Task Assigned: ${data.videoTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">New Task Assigned!</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                    <p style="font-size: 16px; color: #374151;">Hi there,</p>
                    <p style="font-size: 16px; color: #374151;">
                        <strong>${data.creatorEmail}</strong> has assigned you to work on:
                    </p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                        <h2 style="margin: 0 0 10px 0; color: #1f2937;">${data.videoTitle}</h2>
                        <p style="margin: 5px 0; color: #6b7280;">
                            <strong>Your Role:</strong> ${data.role.replace('_', ' ')}
                        </p>
                        ${data.notes ? `<p style="margin: 10px 0; color: #6b7280;"><strong>Notes:</strong> ${data.notes}</p>` : ''}
                    </div>
                    <a href="${process.env.VITE_WEBSITE}/editor/tasks" 
                       style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
                        View Task →
                    </a>
                    <p style="margin-top: 30px; font-size: 14px; color: #9ca3af;">
                        Happy editing!<br/>
                        The YouTeamSync Team
                    </p>
                </div>
            </div>
        `
    }),

    taskCompleted: (data: { creatorEmail: string; editorEmail: string; videoTitle: string; role: string }) => ({
        to: data.creatorEmail,
        subject: `✅ Task Completed: ${data.videoTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">Task Completed! ✅</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                    <p style="font-size: 16px; color: #374151;">Great news!</p>
                    <p style="font-size: 16px; color: #374151;">
                        <strong>${data.editorEmail}</strong> has completed their work on:
                    </p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                        <h2 style="margin: 0 0 10px 0; color: #1f2937;">${data.videoTitle}</h2>
                        <p style="margin: 5px 0; color: #6b7280;">
                            <strong>Role:</strong> ${data.role.replace('_', ' ')}
                        </p>
                    </div>
                    <a href="${process.env.VITE_WEBSITE}/creator/videos" 
                       style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
                        Review Video →
                    </a>
                    <p style="margin-top: 30px; font-size: 14px; color: #9ca3af;">
                        Happy creating!<br/>
                        The YouTeamSync Team
                    </p>
                </div>
            </div>
        `
    }),

    videoPublished: (data: { creatorEmail: string; editorEmail?: string; videoTitle: string; youtubeId: string }) => ({
        to: data.editorEmail || data.creatorEmail,
        subject: `🎉 Video Published: ${data.videoTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">🎉 Video is Live!</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                    <p style="font-size: 16px; color: #374151;">Congratulations!</p>
                    <p style="font-size: 16px; color: #374151;">
                        Your video has been successfully published to YouTube:
                    </p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                        <h2 style="margin: 0 0 10px 0; color: #1f2937;">${data.videoTitle}</h2>
                    </div>
                    <a href="https://youtube.com/watch?v=${data.youtubeId}" 
                       style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
                        Watch on YouTube →
                    </a>
                    <p style="margin-top: 30px; font-size: 14px; color: #9ca3af;">
                        Great work!<br/>
                        The YouTeamSync Team
                    </p>
                </div>
            </div>
        `
    }),

    newMessage: (data: { toEmail: string; fromEmail: string; message: string }) => ({
        to: data.toEmail,
        subject: `💬 New Message from ${data.fromEmail.split('@')[0]}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">💬 New Message</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                    <p style="font-size: 16px; color: #374151;">
                        <strong>${data.fromEmail}</strong> sent you a message:
                    </p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                        <p style="margin: 0; color: #1f2937;">"${data.message}"</p>
                    </div>
                    <a href="${process.env.VITE_WEBSITE}" 
                       style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
                        Reply →
                    </a>
                </div>
            </div>
        `
    })
};

// Send email function
export const sendEmail = async (type: keyof typeof emailTemplates, data: any) => {
    try {
        const emailConfig = emailTemplates[type](data);
        
        await transporter.sendMail({
            from: `"YouTeamSync" <${process.env.EMAIL_USER}>`,
            ...emailConfig
        });
        
        console.log(`✅ Email sent: ${type} to ${emailConfig.to}`);
    } catch (error) {
        console.error('❌ Email send error:', error);
        // Don't throw - email failures shouldn't break the app
    }
};