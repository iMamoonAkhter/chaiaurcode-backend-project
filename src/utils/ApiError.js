/*class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors

        if(stack){
            this.stack = stack

        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}*/


function ApiError(statusCode, message = "Something went wrong", errors = [], stack = "") {
    const error = new Error(message); // Create a new instance of the built-in Error

    // Add custom properties
    error.statusCode = statusCode;
    error.data = message;
    error.success = false;
    error.errors = errors;

    // If a stack is provided, use it; otherwise, capture the stack trace
    if (stack) {
        error.stack = stack;
    } else {
        Error.captureStackTrace(error, ApiError);
    }

    // Return the error object
    return error;
}

export { ApiError };
