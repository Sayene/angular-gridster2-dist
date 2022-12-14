import { GridsterComponentInterface } from './gridster.interface';
export declare class GridsterUtils {
    static merge(obj1: any, obj2: any, properties: any): any;
    static checkTouchEvent(e: any): void;
    static checkContentClassForEvent(gridster: GridsterComponentInterface, e: MouseEvent): boolean;
    static checkContentClassForEmptyCellClickEvent(gridster: GridsterComponentInterface, e: MouseEvent): boolean;
    static checkDragHandleClass(target: HTMLElement, current: HTMLElement, dragHandleClass: string, ignoreContentClass: any): boolean;
    static checkContentClass(target: HTMLElement, current: HTMLElement, contentClass: string): boolean;
    static compareItems(a: {
        x: number;
        y: number;
    }, b: {
        x: number;
        y: number;
    }): number;
}
