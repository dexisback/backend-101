export default class ApiResponse {
    //success:
    static success(data: unknown, message?:string){
        return{
            success: true,
            data,
            ...(message && {message})
        }
    }

    //error
    static error(message:string, statusCode: number){
        return{
            success: false,
            error: message,
            statusCode
        }
    }
}