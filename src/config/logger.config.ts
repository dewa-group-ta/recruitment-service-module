import { Params } from "nestjs-pino";
import { Options } from "pino-http";

const isProduction = process.env.NODE_ENV === "production";

const pinoConfig: Params = {
  pinoHttp: {
    autoLogging: false,
    base: undefined,
    timestamp: !isProduction,
    quietReqLogger: true,
    genReqId: () => undefined,
    transport: isProduction
      ? undefined
      : {
          target: "pino-pretty",
          options: {
            colorize: true,
            singleLine: true
          }
        }
  } as unknown as Options
};

export { pinoConfig };
