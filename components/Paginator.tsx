interface PaginatorProps {
  numMessages: number;
  setNumMessages: (n: number) => void

  messageOffset: number;
  setMessageOffset: (n: number) => void;

  hasMore: boolean
}

export const Paginator = ({numMessages, messageOffset, setMessageOffset, hasMore}: PaginatorProps) => {
  return (
    <div className="flex flex-row justify-center space-x-4">
      <button
        className="disabled:cursor-not-allowed enabled:underline"
        disabled={messageOffset === 0}
        onClick={() => setMessageOffset(messageOffset - numMessages)}
      >
        Prev
      </button>
      <div>
        Showing {messageOffset+1}...{messageOffset + numMessages}
      </div>
      <button
        className="disabled:cursor-not-allowed enabled:underline"
        disabled={!hasMore}
        onClick={() => setMessageOffset(messageOffset + numMessages)}
      >
        Next
      </button>
    </div>
  )
}
