import { ChevronDownIcon, PlusIcon } from '@heroicons/react/outline';
import { Button } from 'app/atoms/button/button';
import { Base, BaseSmall, Info, Subtitle, Title } from 'app/atoms/text';
import Menu from 'app/components/menus/menu';
import { getFilesTree } from 'app/components/uploads/file-tree-utils';
import UploadZone from 'app/components/uploads/upload-zone';
import { setTwakeTabToken } from 'app/features/drive/api-client/api-client';
import { useDriveActions } from 'app/features/drive/hooks/use-drive-actions';
import { useDriveItem, usePublicLink } from 'app/features/drive/hooks/use-drive-item';
import { useDriveRealtime } from 'app/features/drive/hooks/use-drive-realtime';
import { useDriveUpload } from 'app/features/drive/hooks/use-drive-upload';
import { DriveItemSelectedList } from 'app/features/drive/state/store';
import { formatBytes } from 'app/features/drive/utils';
import { ToasterService } from 'app/features/global/services/toaster-service';
import { copyToClipboard } from 'app/features/global/utils/CopyClipboard';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import _ from 'lodash';
import { memo, Suspense, useCallback, useEffect, useRef } from 'react';
import { atomFamily, useRecoilState, useSetRecoilState } from 'recoil';
import { DrivePreview } from '../viewer/drive-preview';
import HeaderPath from './header-path';
import { DocumentRow } from './item-row/document-row';
import { FolderRow } from './item-row/folder-row';
import { ConfirmDeleteModal, ConfirmDeleteModalAtom } from './modals/confirm-delete';
import { ConfirmTrashModal, ConfirmTrashModalAtom } from './modals/confirm-trash';
import { CreateModal, CreateModalAtom } from './modals/create';
import { PropertiesModal } from './modals/properties';
import { SelectorModalAtom } from './modals/selector';
import { AccessModal } from './modals/update-access';
import { VersionsModal } from './modals/versions';

export const DriveCurrentFolderAtom = atomFamily<string, string>({
  key: 'DriveCurrentFolderAtom',
  default: startingParentId => startingParentId || 'root',
});

export default memo(
  ({
    initialParentId,
    twakeTabContextToken,
    inPublicSharing,
  }: {
    initialParentId?: string;
    twakeTabContextToken?: string;
    inPublicSharing?: boolean;
  }) => {
    const companyId = useRouterCompany();
    setTwakeTabToken(twakeTabContextToken || null);

    const [parentId, setParentId] = useRecoilState(
      DriveCurrentFolderAtom(initialParentId || 'root'),
    );

    const { download, downloadZip, update } = useDriveActions();
    const { access, item, inTrash, refresh, children, loading, path } = useDriveItem(parentId);
    const publicLink = usePublicLink(item);
    const { item: trash } = useDriveItem('trash');
    const { uploadTree, uploadFromUrl } = useDriveUpload();
    useDriveRealtime(parentId);

    const uploadZone = 'drive_' + companyId;
    const uploadZoneRef = useRef<UploadZone | null>(null);

    const setCreationModalState = useSetRecoilState(CreateModalAtom);
    const setSelectorModalState = useSetRecoilState(SelectorModalAtom);
    const setConfirmDeleteModalState = useSetRecoilState(ConfirmDeleteModalAtom);
    const setConfirmTrashModalState = useSetRecoilState(ConfirmTrashModalAtom);
    const [checked, setChecked] = useRecoilState(DriveItemSelectedList);

    useEffect(() => {
      setChecked({});
      refresh(parentId);
      if (!inPublicSharing) refresh('trash');
    }, [parentId, refresh]);

    const openItemModal = useCallback(() => {
      if (item?.id) setCreationModalState({ open: true, parent_id: item.id });
    }, [item?.id, setCreationModalState]);

    const selectedCount = Object.values(checked).filter(v => v).length;
    const folders = children
      .filter(i => i.is_directory)
      .sort((a, b) => a.name.localeCompare(b.name));
    const documents = (
      item?.is_directory === false
        ? //We use this hack for public shared single file
          item
          ? [item]
          : []
        : children
    )
      .filter(i => !i.is_directory)
      .sort((a, b) => a.name.localeCompare(b.name));
    return (
      <UploadZone
        overClassName={'!m-4'}
        disableClick
        parent={''}
        multiple={true}
        allowPaste={true}
        ref={uploadZoneRef}
        driveCollectionKey={uploadZone}
        onAddFiles={async (_, event) => {
          const tree = await getFilesTree(event);
          setCreationModalState({ parent_id: '', open: false });
          uploadTree(tree, {
            companyId,
            parentId,
          });
        }}
      >
        <CreateModal
          selectFromDevice={() => uploadZoneRef.current?.open()}
          addFromUrl={(url, name) => {
            setCreationModalState({ parent_id: '', open: false });
            uploadFromUrl(url, name, {
              companyId,
              parentId,
            });
          }}
        />
        <VersionsModal />
        <AccessModal />
        <PropertiesModal />
        <ConfirmDeleteModal />
        <ConfirmTrashModal />
        <Suspense fallback={<></>}>
          <DrivePreview />
        </Suspense>

        <div
          className={
            'flex flex-col p-4 grow h-full overflow-auto ' +
            (loading && !children?.length ? 'opacity-50 ' : '')
          }
        >
          {document.location.origin.includes('canary') && access !== 'read' && (
            <div className="bg-linear-purple w-full hidden sm:block px-4 py-2 rounded-md">
              <Base className=" !text-white">
                Welcome to the next version of Twake Drive.
                <br />
                Your documents are not migrated yet, you can switch back to{' '}
                <a href="https://web.twake.app">https://web.twake.app</a> to see all your documents.
                Documents added here will not be visible yet on production but will be kept after
                the final migration.
              </Base>
            </div>
          )}
          <div className="flex flex-row shrink-0 items-center">
            <HeaderPath path={path || []} inTrash={inTrash} setParentId={setParentId} />
            <div className="grow" />
            {access !== 'read' && (
              <BaseSmall>{formatBytes(item?.size || 0)} used in this folder</BaseSmall>
            )}
            <Menu
              menu={
                selectedCount
                  ? [
                      {
                        type: 'menu',
                        text: 'Move ' + selectedCount + ' items',
                        hide: access === 'read',
                        onClick: () =>
                          setSelectorModalState({
                            open: true,
                            parent_id: inTrash ? 'root' : parentId,
                            title: 'Move ' + selectedCount + ' items',
                            mode: 'move',
                            onSelected: async ids => {
                              for (const item of children.filter(c => checked[c.id])) {
                                await update(
                                  {
                                    parent_id: ids[0],
                                  },
                                  item.id,
                                  item.parent_id,
                                );
                              }
                              setChecked({});
                            },
                          }),
                      },
                      {
                        type: 'menu',
                        text: 'Download ' + selectedCount + ' items',
                        onClick: () =>
                          selectedCount === 1
                            ? download(Object.keys(checked)[0])
                            : downloadZip(Object.keys(checked)),
                      },
                      { type: 'separator', hide: access === 'read' },
                      {
                        type: 'menu',
                        text: 'Delete ' + selectedCount + ' items',
                        hide: !inTrash || access !== 'manage',
                        className: 'error',
                        onClick: () => {
                          setConfirmDeleteModalState({
                            open: true,
                            items: children.filter(a => checked[a.id]),
                          });
                        },
                      },
                      {
                        type: 'menu',
                        text: 'Move ' + selectedCount + ' items to trash',
                        hide: inTrash || access === 'read',
                        className: 'error',
                        onClick: async () =>
                          setConfirmTrashModalState({
                            open: true,
                            items: children.filter(a => checked[a.id]),
                          }),
                      },
                    ]
                  : inTrash
                  ? [
                      {
                        type: 'menu',
                        text: 'Exit trash',
                        onClick: () => setParentId('root'),
                      },
                      { type: 'separator' },
                      {
                        type: 'menu',
                        text: 'Empty trash',
                        className: 'error',
                        hide: parentId != 'trash' || access !== 'manage',
                        onClick: () => {
                          setConfirmDeleteModalState({
                            open: true,
                            items: children, //Fixme: Here it works because this menu is displayed only in the trash root folder
                          });
                        },
                      },
                    ]
                  : [
                      {
                        type: 'menu',
                        text: 'Add document or folder',
                        hide: inTrash || access === 'read',
                        onClick: () => openItemModal(),
                      },

                      {
                        type: 'menu',
                        text: 'Download folder',
                        hide: inTrash,
                        onClick: () => downloadZip([parentId]),
                      },
                      {
                        type: 'menu',
                        text: 'Copy public link',
                        hide:
                          !item?.access_info?.public?.level ||
                          item?.access_info?.public?.level === 'none',
                        onClick: () => {
                          copyToClipboard(publicLink);
                          ToasterService.success('Public link copied to clipboard');
                        },
                      },
                      { type: 'separator' },
                      {
                        type: 'menu',
                        text: 'Go to trash',
                        hide: inTrash || access === 'read',
                        onClick: () => setParentId('trash'),
                      },
                    ]
              }
            >
              {' '}
              <Button theme="outline" className="ml-4 flex flex-row items-center">
                <span>{selectedCount > 1 ? `${selectedCount} items` : 'More'} </span>

                <ChevronDownIcon className="h-4 w-4 ml-2 -mr-1" />
              </Button>
            </Menu>
          </div>

          {!(inTrash || access === 'read') && (
            <div
              className="absolute flex items-center justify-center bg-blue-500 rounded-full cursor-pointer w-14 h-14 bottom-12 right-12 shadow-md hover:bg-blue-600"
              onClick={() => openItemModal()}
            >
              <PlusIcon className="h-7 w-7 text-white" />
            </div>
          )}

          {item?.id === 'trash' && (
            <div className="bg-zinc-500 bg-opacity-10 rounded-md p-4 my-4 w-auto max-w-md">
              <BaseSmall>You are in the trash</BaseSmall>
              <div className="w-full mt-2">
                <Button theme="outline" onClick={() => setParentId('root')}>
                  Exit trash
                </Button>
              </div>
            </div>
          )}
          {access !== 'read' && item?.id === 'root' && (
            <div className="bg-zinc-500 bg-opacity-10 rounded-md p-4 my-4 w-auto max-w-md">
              <BaseSmall>Welcome to your company drive.</BaseSmall>
              <div className="w-full">
                <Title>
                  {formatBytes(item?.size || 0)}
                  <Base> used, </Base> <Base>{formatBytes(trash?.size || 0)} in trash</Base>
                </Title>
              </div>
            </div>
          )}
          {item?.id !== 'root' && item?.id !== 'trash' && <div className="mt-4" />}

          <div className="grow">
            {folders.length > 0 && (
              <>
                <Title className="mb-2 block">Folders</Title>

                {folders.map((item, index) => (
                  <FolderRow
                    key={index}
                    inTrash={inTrash}
                    className={
                      (index === 0 ? 'rounded-t-md ' : '') +
                      (index === folders.length - 1 ? 'rounded-b-md ' : '')
                    }
                    item={item}
                    onClick={() => {
                      return setParentId(item.id);
                    }}
                    checked={checked[item.id] || false}
                    onCheck={v => setChecked(_.pickBy({ ...checked, [item.id]: v }, _.identity))}
                    parentAccess={access}
                  />
                ))}
                <div className="my-6" />
              </>
            )}

            <Title className="mb-2 block">Documents</Title>

            {documents.length === 0 && !loading && (
              <div className="mt-4 text-center border-2 border-dashed rounded-md p-8">
                <Subtitle className="block mb-2">Nothing here.</Subtitle>
                {!inTrash && access != 'read' && (
                  <>
                    <Base>
                      Drag and drop files to upload them or click on the 'Add document' button.
                    </Base>
                    <br />
                    <Button onClick={() => openItemModal()} theme="primary" className="mt-4">
                      Add document or folder
                    </Button>
                  </>
                )}
              </div>
            )}

            {documents.map((item, index) => (
              <DocumentRow
                key={index}
                inTrash={inTrash}
                className={
                  (index === 0 ? 'rounded-t-md ' : '') +
                  (index === documents.length - 1 ? 'rounded-b-md ' : '')
                }
                item={item}
                checked={checked[item.id] || false}
                onCheck={v => setChecked(_.pickBy({ ...checked, [item.id]: v }, _.identity))}
                parentAccess={access}
              />
            ))}
          </div>
        </div>
      </UploadZone>
    );
  },
);