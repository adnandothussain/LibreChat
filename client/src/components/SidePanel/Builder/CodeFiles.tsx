import { useState, useRef, useEffect } from 'react';
import {
  EToolResources,
  mergeFileConfig,
  fileConfig as defaultFileConfig,
} from 'librechat-data-provider';
import type { AssistantsEndpoint, EndpointFileConfig } from 'librechat-data-provider';
import type { ExtendedFile } from '~/common';
import FileRow from '~/components/Chat/Input/Files/FileRow';
import { useGetFileConfig } from '~/data-provider';
import { useFileHandling } from '~/hooks/Files';
import useLocalize from '~/hooks/useLocalize';
import { useChatContext } from '~/Providers';

const default_tool_resource = EToolResources.code_interpreter;

export default function CodeFiles({
  endpoint,
  assistant_id,
  files: _files,
  tool_resource = default_tool_resource,
}: {
  version: number | string;
  endpoint: AssistantsEndpoint;
  assistant_id: string;
  files?: [string, ExtendedFile][];
  tool_resource?: EToolResources;
}) {
  const localize = useLocalize();
  const { setFilesLoading } = useChatContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<Map<string, ExtendedFile>>(new Map());
  const { data: fileConfig = defaultFileConfig } = useGetFileConfig({
    select: (data) => mergeFileConfig(data),
  });
  const { handleFileChange } = useFileHandling({
    overrideEndpoint: endpoint,
    additionalMetadata: { assistant_id, tool_resource },
    fileSetter: setFiles,
  });

  useEffect(() => {
    if (_files) {
      setFiles(new Map(_files));
    }
  }, [_files]);

  const endpointFileConfig = fileConfig.endpoints[endpoint] as EndpointFileConfig | undefined;
  const isUploadDisabled =
    (endpointFileConfig?.disabled ?? false) || (tool_resource === 'file_search' && files.size > 0);

  // if (isUploadDisabled) {
  //   return null;
  // }

  const handleButtonClick = () => {
    // necessary to reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    fileInputRef.current?.click();
  };

  return (
    <div className="mb-2 w-full">
      <div className="flex flex-col gap-4">
        <FileRow
          files={files}
          setFiles={setFiles}
          assistant_id={assistant_id}
          tool_resource={tool_resource}
          setFilesLoading={setFilesLoading}
          Wrapper={({ children }) => <div className="flex flex-wrap gap-2">{children}</div>}
        />
        <div>
          <button
            type="button"
            disabled={isUploadDisabled || !assistant_id}
            className={`btn btn-neutral border-token-border-light relative h-9 w-full rounded-lg font-medium ${
              isUploadDisabled ? 'cursor-not-allowed opacity-50' : ''
            }`}
            onClick={handleButtonClick}
          >
            <div className="flex w-full items-center justify-center gap-2">
              <input
                multiple={tool_resource !== EToolResources.file_search}
                type="file"
                style={{ display: 'none' }}
                tabIndex={-1}
                ref={fileInputRef}
                disabled={!assistant_id || isUploadDisabled}
                onChange={handleFileChange}
              />

              {tool_resource === EToolResources.code_interpreter
                ? localize('com_ui_upload_code_files')
                : tool_resource === EToolResources.file_search
                ? localize('com_ui_upload_file_search')
                : null}
            </div>
          </button>
          {isUploadDisabled && tool_resource === EToolResources.file_search && (
            <p className="mt-2 text-sm text-red-500">
              {localize('com_ui_file_search_limit')} {/* Localize this error message */}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
