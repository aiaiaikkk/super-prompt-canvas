/**
 * Error Helper Utilities
 * 统一错误处理和日志工具 - 消除重复的错误处理代码
 */

// 错误类型定义
export const ERROR_TYPES = {
    DOM_ERROR: 'DOM_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    API_ERROR: 'API_ERROR',
    CANVAS_ERROR: 'CANVAS_ERROR',
    ANNOTATION_ERROR: 'ANNOTATION_ERROR',
    LAYER_ERROR: 'LAYER_ERROR',
    I18N_ERROR: 'I18N_ERROR'
};

// 日志级别
export const LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
};

/**
 * 统一日志记录器
 * @param {string} level - 日志级别
 * @param {string} message - 消息
 * @param {*} data - 附加数据
 * @param {string} errorType - 错误类型
 */
export const logger = (level, message, data = null, errorType = null) => {
    const timestamp = new Date().toISOString();
    const logData = {
        timestamp,
        level,
        message,
        errorType,
        data
    };
    
    // 根据级别选择console方法
    const consoleMethods = {
        [LOG_LEVELS.ERROR]: console.error,
        [LOG_LEVELS.WARN]: console.warn,
        [LOG_LEVELS.INFO]: console.info,
        [LOG_LEVELS.DEBUG]: console.debug
    };
    
    const consoleMethod = consoleMethods[level] || console.log;
    
    if (data) {
        consoleMethod(`[${timestamp}] ${level.toUpperCase()}: ${message}`, data);
    } else {
        consoleMethod(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    }
    
    return logData;
};

/**
 * 错误处理包装器
 * @param {function} operation - 要执行的操作
 * @param {Object} options - 配置选项
 * @returns {*} 操作结果或错误处理后的值
 */
export const withErrorHandling = (operation, options = {}) => {
    const {
        fallbackValue = null,
        errorType = ERROR_TYPES.DOM_ERROR,
        onError = null,
        retries = 0,
        retryDelay = 1000
    } = options;
    
    const executeWithRetry = (attempt = 0) => {
        try {
            return operation();
        } catch (error) {
            logger(LOG_LEVELS.ERROR, `Operation failed (attempt ${attempt + 1})`, {
                error: error.message,
                stack: error.stack,
                errorType
            });
            
            if (onError) {
                onError(error, attempt);
            }
            
            if (attempt < retries) {
                setTimeout(() => executeWithRetry(attempt + 1), retryDelay);
                return;
            }
            
            return fallbackValue;
        }
    };
    
    return executeWithRetry();
};

/**
 * 异步错误处理包装器
 * @param {function} asyncOperation - 异步操作
 * @param {Object} options - 配置选项
 * @returns {Promise} Promise结果
 */
export const withAsyncErrorHandling = async (asyncOperation, options = {}) => {
    const {
        fallbackValue = null,
        errorType = ERROR_TYPES.API_ERROR,
        onError = null,
        retries = 0,
        retryDelay = 1000
    } = options;
    
    const executeWithRetry = async (attempt = 0) => {
        try {
            return await asyncOperation();
        } catch (error) {
            logger(LOG_LEVELS.ERROR, `Async operation failed (attempt ${attempt + 1})`, {
                error: error.message,
                stack: error.stack,
                errorType
            });
            
            if (onError) {
                await onError(error, attempt);
            }
            
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return executeWithRetry(attempt + 1);
            }
            
            return fallbackValue;
        }
    };
    
    return executeWithRetry();
};

/**
 * 创建特定类型的错误处理器
 * @param {string} errorType - 错误类型
 * @param {Object} defaultOptions - 默认选项
 * @returns {function} 错误处理器函数
 */
export const createErrorHandler = (errorType, defaultOptions = {}) => {
    return (operation, options = {}) => {
        return withErrorHandling(operation, {
            errorType,
            ...defaultOptions,
            ...options
        });
    };
};

// 预定义的错误处理器
export const domErrorHandler = createErrorHandler(ERROR_TYPES.DOM_ERROR, {
    fallbackValue: null,
    onError: (error) => {
        logger(LOG_LEVELS.WARN, 'DOM operation failed, continuing with fallback', {
            error: error.message
        });
    }
});

export const validationErrorHandler = createErrorHandler(ERROR_TYPES.VALIDATION_ERROR, {
    fallbackValue: false,
    onError: (error) => {
        logger(LOG_LEVELS.ERROR, 'Validation failed', {
            error: error.message
        });
    }
});

export const canvasErrorHandler = createErrorHandler(ERROR_TYPES.CANVAS_ERROR, {
    fallbackValue: null,
    onError: (error) => {
        logger(LOG_LEVELS.ERROR, 'Canvas operation failed', {
            error: error.message
        });
    }
});

export const annotationErrorHandler = createErrorHandler(ERROR_TYPES.ANNOTATION_ERROR, {
    fallbackValue: null,
    onError: (error) => {
        logger(LOG_LEVELS.ERROR, 'Annotation operation failed', {
            error: error.message
        });
    }
});

/**
 * 数据验证错误处理
 * @param {*} data - 要验证的数据
 * @param {function} validator - 验证函数
 * @param {string} fieldName - 字段名
 * @returns {boolean} 验证结果
 */
export const validateWithErrorHandling = (data, validator, fieldName = 'data') => {
    return validationErrorHandler(() => {
        if (!validator(data)) {
            throw new Error(`Validation failed for ${fieldName}: ${JSON.stringify(data)}`);
        }
        return true;
    });
};

/**
 * 创建错误边界组件（用于React-like组件）
 * @param {function} component - 组件函数
 * @param {function} fallback - 错误时的fallback组件
 * @returns {function} 带错误边界的组件
 */
export const withErrorBoundary = (component, fallback = null) => {
    return (...args) => {
        return domErrorHandler(() => {
            return component(...args);
        }, {
            fallbackValue: fallback ? fallback(...args) : null,
            onError: (error) => {
                logger(LOG_LEVELS.ERROR, 'Component render failed', {
                    component: component.name,
                    error: error.message,
                    args
                });
            }
        });
    };
};

/**
 * 批量错误处理 - 用于处理多个操作
 * @param {Array} operations - 操作数组 [{fn, options}, ...]
 * @param {Object} globalOptions - 全局选项
 * @returns {Array} 结果数组
 */
export const batchErrorHandling = (operations, globalOptions = {}) => {
    const results = [];
    const errors = [];
    
    operations.forEach((op, index) => {
        const { fn, options = {} } = op;
        const mergedOptions = { ...globalOptions, ...options };
        
        const result = withErrorHandling(fn, {
            ...mergedOptions,
            onError: (error) => {
                errors.push({ index, error, operation: fn.name });
                if (mergedOptions.onError) {
                    mergedOptions.onError(error, index);
                }
            }
        });
        
        results.push(result);
    });
    
    if (errors.length > 0) {
        logger(LOG_LEVELS.WARN, `Batch operation completed with ${errors.length} errors`, {
            errors,
            totalOperations: operations.length,
            successCount: operations.length - errors.length
        });
    }
    
    return results;
};

/**
 * 性能监控装饰器
 * @param {function} operation - 要监控的操作
 * @param {string} operationName - 操作名称
 * @returns {*} 操作结果
 */
export const withPerformanceMonitoring = (operation, operationName = 'operation') => {
    return withErrorHandling(() => {
        const startTime = performance.now();
        
        try {
            const result = operation();
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            if (duration > 100) { // 超过100ms记录警告
                logger(LOG_LEVELS.WARN, `Slow operation detected: ${operationName}`, {
                    duration: `${duration.toFixed(2)}ms`
                });
            } else {
                logger(LOG_LEVELS.DEBUG, `Operation completed: ${operationName}`, {
                    duration: `${duration.toFixed(2)}ms`
                });
            }
            
            return result;
        } catch (error) {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            logger(LOG_LEVELS.ERROR, `Operation failed: ${operationName}`, {
                duration: `${duration.toFixed(2)}ms`,
                error: error.message
            });
            
            throw error;
        }
    }, {
        errorType: ERROR_TYPES.DOM_ERROR,
        onError: (error) => {
            logger(LOG_LEVELS.ERROR, `Performance monitoring failed for: ${operationName}`, {
                error: error.message
            });
        }
    });
};