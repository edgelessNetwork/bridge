import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from 'util/apiUtils';

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const res = verifyAuth(request, response);
  if (res) return res;

  if (request.method === 'POST') {
    return response.status(405).json({
      error: 'Expected GET, PUT, or DELETE request',
    });
  }
  const { configId } = request.query;
  const requestedConfigId = configId ? configId[0] : null;
  if (!requestedConfigId) {
    return response.status(405).json({
      error: 'Invalid request format',
    });
  }

  // Handle UPDATE request
  switch (request.method) {
    case 'GET':
      await prisma.$connect();
      const createdConfig = await prisma_getter(requestedConfigId);
      await prisma.$disconnect();
      return response.status(200).json(createdConfig);
    case 'PUT':
      const configData = request.body;
      configData.config = JSON.stringify(configData.config);
      configData.logo = Buffer.from(request.body.logo);
      configData.wordmark = Buffer.from(request.body.wordmark);

      await prisma.$connect();
      const modifiedConfig = await prisma_updater(configData);
      await prisma.$disconnect();
      return response.status(200).json(modifiedConfig);
    case 'DELETE':
      await prisma.$connect();
      const deletedConfig = await prisma_destroyer(requestedConfigId);
      await prisma.$disconnect();
      return response.status(200).json(deletedConfig);
    default:
      return response.status(405).json({
        error: 'Invalid Request',
      });
  }
}

const prisma = new PrismaClient();
async function prisma_getter(requestedConfigId: any) {
  // check if entry for name already exists
  let client = await prisma.client.findUnique({
    where: {
      id: requestedConfigId,
    },
  });
  return client;
}

async function prisma_updater(data: any) {
  // check if entry for name already exists
  let client = await prisma.client.findUnique({
    where: {
      id: data.id,
    },
  });
  // create or update entry
  if (!client) {
    throw 'Client not found';
  }
  const { id, ...tempData } = data; // cannot modify name during update as it is an ID
  await prisma.client.update({
    where: {
      id: data.id,
    },
    data: tempData,
  });
  return data;
}

async function prisma_destroyer(requestedConfigId: any) {
  let client = await prisma.client.findUnique({
    where: {
      id: requestedConfigId,
    },
  });
  // delete entry
  if (!client) {
    throw 'Client not found';
  }
  await prisma.client.delete({
    where: {
      id: requestedConfigId,
    },
  });
  return client;
}
