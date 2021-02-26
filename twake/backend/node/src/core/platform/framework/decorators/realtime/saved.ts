import { getRealtimeRecipients, getRoom, RealtimeRecipients } from "..";
import { SaveResult } from "../../api/crud-service";
import { RealtimeEntityEvent, RealtimeEntityActionType } from "../../../services/realtime/types";
import { eventBus } from "../../../services/realtime/bus";

/**
 *
 * @param path the path to push the notification to
 * @param resourcePath the path of the resource itself
 */
export function RealtimeSaved<T>(recipients: RealtimeRecipients<T>): MethodDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor): void {
    const originalMethod = descriptor.value;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function (...args: any[]) {
      const result: SaveResult<T> = await originalMethod.apply(this, args);
      // context should always be the last arg
      const context = args && args[args.length - 1];

      if (!(result instanceof SaveResult)) {
        return result;
      }

      getRealtimeRecipients(recipients, result.entity, context).forEach(
        ({ room, path, resource }) => {
          eventBus.publish<T>(RealtimeEntityActionType.Saved, {
            type: result.type,
            room: getRoom(room, result, context),
            resourcePath: path,
            entity: resource,
            result,
          } as RealtimeEntityEvent<T>);
        },
      );

      return result;
    };
  };
}