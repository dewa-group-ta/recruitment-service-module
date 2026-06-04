import { SetMetadata } from "@nestjs/common";

export const ResponseMessageKey = "ResponseMessageKey";

export const ResponseMessage = (
  { caseCode, message }: { caseCode: string; message: string },
  additionalMessage = ""
) => SetMetadata(ResponseMessageKey, { caseCode, message, additionalMessage });
