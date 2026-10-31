import { NextFunction, Request, Response } from "express";
import { ValidationChain, validationResult } from "express-validator";
import logger from "../lib/logger";

export const validator =
  (validator: ValidationChain[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validator.map((validator) => validator.run(req)));

    const error = validationResult(req);

    if (error.isEmpty()) {
      return next();
    }
    const errorList = error.array();
    logger.error(
      "error from validator",
      errorList.map((d: { msg: string }) => d.msg),
    );

    const firstMsg = String(errorList[0]?.msg || "Validation error");
    const isEmailDup =
      firstMsg.toLowerCase().includes("already registered") ||
      firstMsg.toLowerCase().includes("already exists");
    const code = isEmailDup ? "EMAIL_ALREADY_EXISTS" : firstMsg;
    const field = isEmailDup ? "email" : ((errorList[0] as any)?.path || (errorList[0] as any)?.param);

    res.status(400).json({
      statusCode: 400,
      success: false,
      code,
      message: firstMsg,
      field,
      response: {
        code: errorList.map((d: { msg: string }) => d.msg),
        name: "error",
        message: firstMsg,
        stack: errorList,
      },
    });
  };
export default validator;
