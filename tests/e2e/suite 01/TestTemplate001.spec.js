/*
      Copyright 2026 Jacopo Enrico Marinaccio
      Licensed under the Apache License, Version 2.0
      You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
      */
      import { suite } from './suite.config.js';
      import { logger } from '../../../src/utils/frameworkUtils/logger.js';
      import { test, expect } from '../../fixtures/fixtures.js';

      test.describe(suite.name, () => {
        test('Define your testname here', async ({ basePage }) => {
      
          // Define your test steps here, for example:
          await basePage.open(suite.baseURL, 'Your expected title');
      
        });
      });

      