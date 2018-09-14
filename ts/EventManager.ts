import { EventSubscriber } from "decentraland-api"

export namespace EventManager {
  let eventSubscriber: EventSubscriber

  export function init(_eventSubscriber: EventSubscriber) {
    eventSubscriber = _eventSubscriber
  }

  export function emit(eventType: string, ...params: any[]) {
    eventSubscriber.emit(eventType, ...params)
  }
}