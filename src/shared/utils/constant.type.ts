type ResponseMessageType = {
  httpStatus: number;
  caseCode: string;
  message: string;
};

export type TresponseMessage = {
  [key: string]: ResponseMessageType;
};

export type Role = { [key: string]: string };
