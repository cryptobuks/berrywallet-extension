import {createDebugger} from 'Core/Debugger';
import {createMemoryHistory} from "history";

const debug = createDebugger('MODAL');
export const modalHistory = createMemoryHistory();

export function openModal(modalPath, modalProps: any = {}) {
    debug(modalPath, modalProps);
    modalHistory.push(modalPath, modalProps);
}

export function closeModal() {
    modalHistory.push('/');
}


export class ModalObserver {
    // @deprecated
    public openModal(modalPath, modalProps: any = {}) {
        debug(modalPath, modalProps);
        modalHistory.push(modalPath, modalProps);
    }

    // @deprecated
    public closeModal() {
        modalHistory.push('/');
    }
}

// @deprecated
export const modalObserverInstance = new ModalObserver();