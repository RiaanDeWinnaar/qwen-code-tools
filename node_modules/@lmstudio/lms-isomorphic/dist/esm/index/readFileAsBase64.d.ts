export declare function readFileAsBase64(path: string): Promise<{
    success: true;
    base64: string;
} | {
    success: false;
}>;
