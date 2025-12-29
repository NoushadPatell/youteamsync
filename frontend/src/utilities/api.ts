// API configuration and helper functions
const BACKEND_URL = "http://localhost:5000";

export const apiCall = async (endpoint: string, method: string = 'GET', body?: any) => {
    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
    
    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
};

// Creator APIs
export const getCreatorData = (email: string) =>
    apiCall(`/api/creator/${encodeURIComponent(email)}`);

export const updateCreatorData = (email: string, data: any) =>
    apiCall(`/api/creator/${encodeURIComponent(email)}`, 'PUT', data);

// Video APIs
export const getCreatorVideos = (creatorEmail: string) =>
    apiCall(`/api/videos/${encodeURIComponent(creatorEmail)}`);

export const uploadVideo = (creatorEmail: string, videoData: any) =>
    apiCall(`/api/videos/${encodeURIComponent(creatorEmail)}`, 'POST', videoData);

export const updateVideo = (creatorEmail: string, videoId: string, videoData: any) =>
    apiCall(`/api/videos/${encodeURIComponent(creatorEmail)}/${videoId}`, 'PUT', videoData);

export const deleteVideo = (creatorEmail: string, videoId: string) =>
    apiCall(`/api/videos/${encodeURIComponent(creatorEmail)}/${videoId}`, 'DELETE');

// Editor APIs
export const getEditors = () =>
    apiCall('/api/editors');

export const getCreatorRequests = (editorEmail: string) =>
    apiCall(`/api/editor/${encodeURIComponent(editorEmail)}/requests`);

export const getEditorCreators = (editorEmail: string) =>
    apiCall(`/api/editor/${encodeURIComponent(editorEmail)}/creators`);

// Rating APIs
export const updateRating = (creatorEmail: string, videoId: string, editedBy: string, rating: number) =>
    apiCall('/api/rating', 'POST', { creatorEmail, videoId, editedBy, rating });

// Chat APIs
export const getChatMessages = (email1: string, email2: string) => {
    const emails = [email1, email2].sort();
    const chatId = emails.join('');
    return apiCall(`/api/chats/${chatId}`);
};
