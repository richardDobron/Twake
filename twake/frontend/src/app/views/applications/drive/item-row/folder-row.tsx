import { DotsHorizontalIcon } from '@heroicons/react/outline';
import { FolderIcon } from '@heroicons/react/solid';
import { Button } from 'app/atoms/button/button';
import { Base, BaseSmall } from 'app/atoms/text';
import Menu from 'app/components/menus/menu';
import { useDriveActions } from 'app/features/drive/hooks/use-drive-actions';
import { usePublicLink } from 'app/features/drive/hooks/use-drive-item';
import { formatBytes } from 'app/features/drive/utils';
import { ToasterService } from 'app/features/global/services/toaster-service';
import { copyToClipboard } from 'app/features/global/utils/CopyClipboard';
import { useState } from 'react';
import { useSetRecoilState } from 'recoil';
import { PublicIcon } from '../components/public-icon';
import { ConfirmDeleteModalAtom } from '../modals/confirm-delete';
import { ConfirmTrashModalAtom } from '../modals/confirm-trash';
import { PropertiesModalAtom } from '../modals/properties';
import { SelectorModalAtom } from '../modals/selector';
import { AccessModalAtom } from '../modals/update-access';
import { CheckableIcon, DriveItemProps } from './common';

export const FolderRow = ({
  item,
  inTrash,
  className,
  onCheck,
  checked,
  onClick,
  parentAccess,
}: DriveItemProps) => {
  const [hover, setHover] = useState(false);
  const { download, update } = useDriveActions();
  const setSelectorModalState = useSetRecoilState(SelectorModalAtom);
  const setAccessModalState = useSetRecoilState(AccessModalAtom);
  const setPropertiesModalState = useSetRecoilState(PropertiesModalAtom);
  const setConfirmDeleteModalState = useSetRecoilState(ConfirmDeleteModalAtom);
  const setConfirmTrashModalState = useSetRecoilState(ConfirmTrashModalAtom);
  const publicLink = usePublicLink(item);

  return (
    <div
      className={
        'flex flex-row items-center border -mt-px px-4 py-3 cursor-pointer ' +
        (className || '') +
        (checked
          ? 'bg-blue-500 bg-opacity-10 hover:bg-opacity-25 '
          : 'hover:bg-zinc-500 hover:bg-opacity-10 ') +
        (className || '')
      }
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={e => {
        if (e.shiftKey || e.ctrlKey) onCheck(!checked);
        else if (onClick) onClick();
      }}
    >
      <div onClick={e => e.stopPropagation()}>
        <CheckableIcon
          className="mr-2 -ml-1"
          show={hover || checked}
          checked={checked}
          onCheck={onCheck}
          fallback={<FolderIcon className="h-5 w-5 shrink-0 text-blue-500" />}
        />
      </div>
      <div className="grow text-ellipsis whitespace-nowrap overflow-hidden">
        <Base className="!font-semibold">{item.name}</Base>
      </div>
      <div className="shrink-0 ml-4">
        {item?.access_info?.public?.level !== 'none' && (
          <PublicIcon className="h-5 w-5 text-blue-500" />
        )}
      </div>
      <div className="shrink-0 ml-4 text-right" style={{ minWidth: 80 }}>
        <BaseSmall>{formatBytes(item.size)}</BaseSmall>
      </div>
      <div className="shrink-0 ml-4">
        <Menu
          menu={[
            {
              type: 'menu',
              text: 'Download',
              onClick: () => download(item.id),
            },
            { type: 'separator' },
            {
              type: 'menu',
              text: 'Modify properties',
              hide: parentAccess === 'read',
              onClick: () => setPropertiesModalState({ open: true, id: item.id }),
            },
            {
              type: 'menu',
              text: 'Manage access',
              hide: parentAccess === 'read',
              onClick: () => setAccessModalState({ open: true, id: item.id }),
            },
            {
              type: 'menu',
              text: 'Copy public link',
              hide: !item.access_info.public?.level || item.access_info.public?.level === 'none',
              onClick: () => {
                copyToClipboard(publicLink);
                ToasterService.success('Public link copied to clipboard');
              },
            },
            {
              type: 'menu',
              text: 'Move',
              hide: parentAccess === 'read',
              onClick: () =>
                setSelectorModalState({
                  open: true,
                  parent_id: inTrash ? 'root' : item.parent_id,
                  mode: 'move',
                  title: `Move '${item.name}'`,
                  onSelected: async ids => {
                    await update(
                      {
                        parent_id: ids[0],
                      },
                      item.id,
                      item.parent_id,
                    );
                  },
                }),
            },
            { type: 'separator', hide: parentAccess === 'read' },
            {
              type: 'menu',
              text: 'Move to trash',
              className: 'error',
              hide: inTrash || parentAccess === 'read',
              onClick: () => setConfirmTrashModalState({ open: true, items: [item] }),
            },
            {
              type: 'menu',
              text: 'Delete',
              className: 'error',
              hide: !inTrash || parentAccess === 'read',
              onClick: () => setConfirmDeleteModalState({ open: true, items: [item] }),
            },
          ]}
        >
          <Button
            theme={'secondary'}
            size="sm"
            className={'!rounded-full '}
            icon={DotsHorizontalIcon}
          />
        </Menu>
      </div>
    </div>
  );
};