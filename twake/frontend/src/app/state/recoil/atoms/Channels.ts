import { atomFamily } from 'recoil';
import _ from 'lodash';
import { ChannelType } from 'app/models/Channel';

export const ChannelState = atomFamily<ChannelType, string>({
  key: 'ChannelState',
  default: id => ({ id } as ChannelType),
});