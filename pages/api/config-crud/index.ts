// Handle CREATE requests
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from 'util/apiUtils';

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const errorResponse = verifyAuth(request, response);
  if (errorResponse) {
    return errorResponse;
  }

  if (request.method !== 'POST') {
    return response.status(405).json({
      error: 'Expected POST request',
    });
  }
  const configData = request.body;
  configData.config = JSON.stringify(configData.config);
  configData.logo = Buffer.from(request.body.logo);
  configData.wordmark = Buffer.from(request.body.wordmark);
  if (!configData.config) {
    return response.status(405).json({
      error: 'Invalid request format',
    });
  }

  const modifiedConfig = await prisma_helper_wrapper(configData);

  // Return the written object/config
  // Return 409 conflict if the entry already exists
  return response.status(modifiedConfig.status).json(modifiedConfig.data);
}

// Helper functions for developers to query or modify the database
const prisma = new PrismaClient();
async function prisma_helper(reqData: any) {
  const data = reqData;

  // verify if entry for name already exists
  let client = await prisma.client.findUnique({
    where: {
      id: data.id,
    },
  });

  // create entry
  if (!client) {
    client = await prisma.client.create({
      data: data,
    });
    return {status: 200, data: client};
  }

  return {status: 409, data: client};
}

async function prisma_helper_wrapper(data: any) {
  await prisma.$connect();
  const modifiedData = await prisma_helper(data);
  await prisma.$disconnect();
  return modifiedData;
}
