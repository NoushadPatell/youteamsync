export type CreatorOutletContext = {
    email: string;
    editor: string;
    setEditor: React.Dispatch<React.SetStateAction<string>>;
};

export type EditorOutletContext = {
    email: string;
};