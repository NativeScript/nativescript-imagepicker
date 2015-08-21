declare module "background-http" {
    /**
     * Get or create a background download/upload session by id.
     */
    export function session(id: string): Session;

    interface BackgroundHttpTask {
        /**
         * Get the description of the task, that was provided during the task creation.
         */
        description: string;

        /**
         * Gets the current count of uploaded bytes. (read-only)
         */
        upload: number;

        /**
         * Gets the expected total count of bytes to upload. (read-only)
         */
        totalUpload: number;
    }

    interface Session {
        uploadFile(fileUri: string, request: Request): BackgroundHttpTask;
        
        /**
         * The data argument should be NSData for iOS.
         * Not implemented yet for Android.
         * In future it will be an ArrayBuffer (that may be wrapping NSData).
         */
        uploadData(data: any, request: Request): BackgroundHttpTask;
    }

    interface Request {
        /**
         * Gets or sets the request url.
         */
        url: string;

        /**
         * Gets or set the HTTP method.
         * By default 'GET' will be used.
         */
        method?: string;

        /**
         * Specify additional HTTP headers.
         */
        headers?: {};

        /**
         * Use this to help you identify the task.
         * Sets the HttpTask's description property.
         * You can as well store serialized JSON object.
         */
        description: string;

        /**
         * Gets the session this task is scheduled in. (read-only)
         */
        session: Session;
    }
}
