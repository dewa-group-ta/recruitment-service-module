import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

jest.setTimeout(120_000);

import { Logger } from '@nestjs/common';
jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);