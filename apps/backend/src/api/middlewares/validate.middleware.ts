import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, z } from 'zod';
import { BadRequestError } from '../../core/errors/app-error';

interface ValidationSchema {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export const validate = (schema: ValidationSchema) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.params) {
        req.params = (await schema.params.strict().parseAsync(req.params)) as any;
      }
      if (schema.query) {
        req.query = (await schema.query.strict().parseAsync(req.query)) as any;
      }
      if (schema.body) {
        req.body = await schema.body.strict().parseAsync(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => {
          let message = issue.message;
          if (issue.code === z.ZodIssueCode.unrecognized_keys) {
            message = `Trường dữ liệu lạ không được phép: ${issue.keys.join(', ')}`;
          }
          return {
            field: issue.path.join('.'),
            code: issue.code,
            message,
          };
        });

        next(
          new BadRequestError(
            'Dữ liệu yêu cầu không hợp lệ hoặc chứa trường lạ',
            'VALIDATION_ERROR',
            details
          )
        );
        return;
      }
      next(error);
    }
  };
};

export default validate;
