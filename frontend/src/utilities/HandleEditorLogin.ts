export const HandleEditorLogin = async () => {
    try {
        // Use the same OAuth flow as creator
        const response = await fetch(`${import.meta.env.VITE_BACKEND}/getAuthUrl`);
        const { authorizeUrl } = await response.json();
        
        // Store that this is an editor login
        sessionStorage.setItem('loginType', 'editor');
        
        // Redirect to Google OAuth
        window.location.href = authorizeUrl;
        
        return new Promise((resolve) => resolve("redirecting"));
    } catch (err) {
        return new Promise((_res, reject) => {
            reject(new Error("Error initiating login"));
        });
    }
}