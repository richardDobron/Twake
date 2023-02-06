import { describe, expect, it, jest } from "@jest/globals";
import { UpdateResult } from "../../../../../../../src/core/platform/framework/api/crud-service";
import { RealtimeUpdated } from "../../../../../../../src/core/platform/framework/decorators";
import { websocketEventBus } from "../../../../../../../src/core/platform/services/realtime/bus";
import { ResourcePath } from "../../../../../../../src/core/platform/services/realtime/types";

describe("The RealtimeUpdated decorator", () => {
  it("should call the original method send back original result but do not emit event if result type is wrong", async () => {
    const emitSpy = jest.spyOn(websocketEventBus, "emit");

    class TestMe {
      @RealtimeUpdated({ room: "/foo/bar" })
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      reverseMeBaby(input: string): Promise<string> {
        return Promise.resolve(input.split("").reverse().join(""));
      }
    }

    const test = new TestMe();
    const originalSpy = jest.spyOn(test, "reverseMeBaby");
    const result = await test.reverseMeBaby("yolo");

    expect(result).toEqual("oloy");
    expect(originalSpy).toHaveBeenCalledTimes(1);
    expect(originalSpy).toHaveBeenCalledWith("yolo");
    expect(emitSpy).toHaveBeenCalledTimes(0);

    emitSpy.mockRestore();
  });

  it("should call the original method send back original result and emit event", async () => {
    const emitSpy = jest.spyOn(websocketEventBus, "emit");

    class TestMe {
      @RealtimeUpdated({ room: "/foo/bar", path: "/foo/bar/baz" })
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      async reverseMeBaby(input: string): Promise<UpdateResult<string>> {
        return new UpdateResult<string>("string", input.split("").reverse().join(""));
      }
    }

    const test = new TestMe();
    const originalSpy = jest.spyOn(test, "reverseMeBaby");
    const result = await test.reverseMeBaby("yolo");

    expect(result.entity).toEqual("oloy");
    expect(originalSpy).toHaveBeenCalledTimes(1);
    expect(originalSpy).toHaveBeenCalledWith("yolo");
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith("updated", {
      entity: "oloy",
      room: {
        name: "default",
        path: ["/foo/bar"],
      } as ResourcePath,
      resourcePath: "/foo/bar/baz",
      type: "string",
      result: {
        type: "string",
        entity: "oloy",
        affected: undefined,
        context: undefined,
        operation: "update",
        raw: undefined,
      } as UpdateResult<string>,
    });

    emitSpy.mockRestore();
  });

  it("should emit event with path computed from function", async () => {
    const emitSpy = jest.spyOn(websocketEventBus, "emit");

    class TestMe {
      @RealtimeUpdated(result => [
        { room: ResourcePath.get(`/foo/bar/${result}`), path: "/foo/bar/baz" },
      ])
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      async reverseMeBaby(input: string): Promise<UpdateResult<string>> {
        return new UpdateResult<string>("string", input.split("").reverse().join(""));
      }
    }

    const test = new TestMe();
    const originalSpy = jest.spyOn(test, "reverseMeBaby");
    const result = await test.reverseMeBaby("yolo");

    expect(result.entity).toEqual("oloy");
    expect(originalSpy).toHaveBeenCalledTimes(1);
    expect(originalSpy).toHaveBeenCalledWith("yolo");
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith("updated", {
      entity: "oloy",
      room: {
        name: "default",
        path: ["/foo/bar/oloy"],
      } as ResourcePath,
      resourcePath: "/foo/bar/baz",
      type: "string",
      result: {
        type: "string",
        context: undefined,
        operation: "update",
        entity: "oloy",
        affected: undefined,
        raw: undefined,
      } as UpdateResult<string>,
    });

    emitSpy.mockRestore();
  });
});
