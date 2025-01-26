/*class ApiResponse {
    constructor(statusCode, data, message = "Success"){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}

export  {ApiResponse}*/

function ApiResponse(statusCode, data, message = "Success") {
    return {
        statusCode,
        data,
        message,
        success: statusCode < 400
    };
}

export { ApiResponse };
