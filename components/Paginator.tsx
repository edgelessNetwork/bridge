interface PaginatorProps {
  numMessages: number;
  setNumMessages: (n: number) => void;

  messageOffset: number;
  setMessageOffset: (n: number) => void;

  hasMore: boolean;
}

export const Paginator = ({
  numMessages,
  messageOffset,
  setMessageOffset,
  hasMore,
}: PaginatorProps) => {
  return (
    <div className="flex flex-row justify-start space-x-4">
      <div className="flex flex-col items-center">
        <span className="text-sm text-gray-700 dark:text-gray-400">
          Showing{' '}
          <span className="font-semibold text-gray-900 dark:text-white">{messageOffset + 1}</span> to{' '} of{' '}
          <span className="font-semibold text-gray-900 dark:text-white">{messageOffset + numMessages}</span>{' '}
          Entries
        </span>
        <div className="inline-flex mt-2 xs:mt-0">
          <button 
          className="flex items-center justify-center px-4 h-10 text-base font-medium text-white bg-[#171D1F] rounded-s hover:brightness-125 dark:bg-[#171D1F] dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          disabled={messageOffset === 0}
          onClick={() => setMessageOffset(messageOffset - numMessages)}>
            Prev
          </button>
          <button 
          className="flex items-center justify-center px-4 h-10 text-base font-medium text-white bg-[#171D1F] border-0 border-s border-[#171D1F] rounded-e hover:brightness-125 dark:bg-[#171D1F] dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          disabled={!hasMore}
          onClick={() => setMessageOffset(messageOffset + numMessages)}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
