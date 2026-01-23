import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { LuLoader2 } from "react-icons/lu";
import { SetCookie } from "@/utilities/get_set_cookies.ts";
import { apiCall } from "@/utilities/api.ts";

export const Oauth2callback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const code = searchParams.get('code');
        const loginType = sessionStorage.getItem('loginType') || 'creator';
        
        if (code) {
            fetch(`${import.meta.env.VITE_BACKEND}/getEmail`, {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({ code })
            }).then((response) => {
                return response.json();
            }).then(async (output) => {
                const { email, error } = output;
                if (error) {
                    throw new Error(error);
                } else if (email) {
                    console.log(email);
                    
                    if (loginType === 'editor') {
                        // Register as editor
                        try {
                            await apiCall(`/api/editor/register`, 'POST', { email });
                            sessionStorage.removeItem('loginType');
                            SetCookie(JSON.stringify({ email, cookie: "" }), 'editor');
                            navigate('/editor', { replace: true });
                        } catch (err) {
                            throw new Error("Failed to register editor");
                        }
                    } else {
                        // Regular creator flow
                        sessionStorage.removeItem('loginType');
                        SetCookie(JSON.stringify({ email, cookie: "" }), 'creator');
                        navigate('/creator', { replace: true });
                    }
                }
            }).catch((err) => {
                console.log(err);
                alert(err.message);
                sessionStorage.removeItem('loginType');
                navigate("/login", { replace: true });
            })
        }

        const error = searchParams.get('error');
        if (error || !code) {
            sessionStorage.removeItem('loginType');
            navigate("/login", { replace: true });
        }

    }, [navigate, searchParams]);

    return <div className={"h-svh flex items-center justify-center"}>
        <LuLoader2 className={"animate-spin"} size={50} />
    </div>
}