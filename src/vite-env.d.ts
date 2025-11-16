/// <reference types="vite/client" />

// Para las APIs de Chrome
declare namespace chrome {
  namespace runtime {
    function sendMessage(message: any, responseCallback?: (response: any) => void): void;
    const onMessage: {
      addListener(
        callback: (message: any, sender: any, sendResponse: (response?: any) => void) => void
      ): void;
    };
  }

  namespace storage {
    namespace local {
      function get(keys: string | string[] | null): Promise<{ [key: string]: any }>;
      function set(items: { [key: string]: any }): Promise<void>;
    }
  }
}
