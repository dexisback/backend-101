export class ApiResponse {
    static success<T>(data: T, message?: string){
        return {
            success: true, 
            data, 
            ...(message && {message})
        }
    }

    static error(message: string, statusCode: number = 500){
        return{
            success: false, 
            error: message,
            statusCode
        }
    }
}

