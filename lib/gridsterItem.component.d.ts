import { ElementRef, NgZone, OnChanges, OnDestroy, OnInit, Renderer2, SimpleChanges, EventEmitter } from '@angular/core';
import { GridsterDraggable } from './gridsterDraggable.service';
import { GridsterResizable } from './gridsterResizable.service';
import { GridsterItem, GridsterItemComponentInterface } from './gridsterItem.interface';
import { GridsterComponent } from './gridster.component';
import * as i0 from "@angular/core";
export declare class GridsterItemComponent implements OnInit, OnDestroy, OnChanges, GridsterItemComponentInterface {
    renderer: Renderer2;
    private zone;
    item: GridsterItem;
    itemInit: EventEmitter<{
        item: GridsterItem;
        itemComponent: GridsterItemComponentInterface;
    }>;
    itemChange: EventEmitter<{
        item: GridsterItem;
        itemComponent: GridsterItemComponentInterface;
    }>;
    itemResize: EventEmitter<{
        item: GridsterItem;
        itemComponent: GridsterItemComponentInterface;
    }>;
    $item: GridsterItem;
    el: HTMLElement;
    gridster: GridsterComponent;
    top: number;
    left: number;
    width: number;
    height: number;
    drag: GridsterDraggable;
    resize: GridsterResizable;
    notPlaced: boolean;
    init: boolean;
    get zIndex(): number;
    constructor(el: ElementRef, gridster: GridsterComponent, renderer: Renderer2, zone: NgZone);
    ngOnInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    updateOptions(): void;
    ngOnDestroy(): void;
    setSize(): void;
    updateItemSize(): void;
    itemChanged(): void;
    checkItemChanges(newValue: GridsterItem, oldValue: GridsterItem): void;
    canBeDragged(): boolean;
    canBeResized(): boolean;
    getResizableHandles(): {
        s: boolean;
        e: boolean;
        n: boolean;
        w: boolean;
        se: boolean;
        ne: boolean;
        sw: boolean;
        nw: boolean;
    };
    bringToFront(offset: number): void;
    sendToBack(offset: number): void;
    private getLayerIndex;
    static ɵfac: i0.ɵɵFactoryDeclaration<GridsterItemComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<GridsterItemComponent, "gridster-item", never, { "item": "item"; }, { "itemInit": "itemInit"; "itemChange": "itemChange"; "itemResize": "itemResize"; }, never, ["*"], false>;
}
