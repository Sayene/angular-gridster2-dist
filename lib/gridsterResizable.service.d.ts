import { NgZone } from '@angular/core';
import { GridsterComponentInterface } from './gridster.interface';
import { GridsterItemComponentInterface } from './gridsterItem.interface';
import { GridsterPush } from './gridsterPush.service';
import { GridsterPushResize } from './gridsterPushResize.service';
import { GridsterResizeEventType } from './gridsterResizeEventType.interface';
export declare class GridsterResizable {
    private zone;
    gridsterItem: GridsterItemComponentInterface;
    gridster: GridsterComponentInterface;
    lastMouse: {
        clientX: number;
        clientY: number;
    };
    itemBackup: number[];
    resizeEventScrollType: GridsterResizeEventType;
    /**
     * The direction function may reference any of the `GridsterResizable` class methods, that are
     * responsible for gridster resize when the `dragmove` event is being handled. E.g. it may reference
     * the `handleNorth` method when the north handle is pressed and moved by a mouse.
     */
    private directionFunction;
    resizeEnabled: boolean;
    resizableHandles: {
        s: boolean;
        e: boolean;
        n: boolean;
        w: boolean;
        se: boolean;
        ne: boolean;
        sw: boolean;
        nw: boolean;
    };
    mousemove: () => void;
    mouseup: () => void;
    mouseleave: () => void;
    cancelOnBlur: () => void;
    touchmove: () => void;
    touchend: () => void;
    touchcancel: () => void;
    push: GridsterPush;
    pushResize: GridsterPushResize;
    minHeight: number;
    minWidth: number;
    offsetTop: number;
    offsetLeft: number;
    diffTop: number;
    diffLeft: number;
    diffRight: number;
    diffBottom: number;
    margin: number;
    originalClientX: number;
    originalClientY: number;
    top: number;
    left: number;
    bottom: number;
    right: number;
    width: number;
    height: number;
    newPosition: number;
    constructor(gridsterItem: GridsterItemComponentInterface, gridster: GridsterComponentInterface, zone: NgZone);
    destroy(): void;
    dragStart(e: MouseEvent): void;
    dragMove: (e: MouseEvent) => void;
    dragStop: (e: MouseEvent) => void;
    cancelResize: () => void;
    makeResize: () => void;
    private handleNorth;
    private handleWest;
    private handleSouth;
    private handleEast;
    private handleNorthWest;
    private handleNorthEast;
    private handleSouthWest;
    private handleSouthEast;
    toggle(): void;
    dragStartDelay(e: MouseEvent | TouchEvent): void;
    setItemTop(top: number): void;
    setItemLeft(left: number): void;
    setItemHeight(height: number): void;
    setItemWidth(width: number): void;
}
