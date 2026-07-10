// apps/web/lib/axiom/server.ts
import { Axiom } from '@axiomhq/js';
import { Logger, AxiomJSTransport, ConsoleTransport } from '@axiomhq/logging';
import { createAxiomRouteHandler, nextJsFormatters } from '@axiomhq/nextjs';

const axiomClient = new Axiom({
  token: process.env.AXIOM_TOKEN!, 
});

export const logger = new Logger({
  transports: [
    // 1. Sends logs to your terminal 
    // new ConsoleTransport({ 
    //   prettyPrint: true, 
    //   logLevel: 'debug' 
    // }),
    
    // 2. Sends logs over the network to the Axiom Dashboard
    new AxiomJSTransport({ 
      axiom: axiomClient, 
      dataset: process.env.AXIOM_DATASET!,
    }),
  ],
  formatters: nextJsFormatters,
});

export const withAxiom = createAxiomRouteHandler(logger);