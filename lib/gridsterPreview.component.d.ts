import { ElementRef, EventEmitter, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { GridsterRenderer } from './gridsterRenderer.service';
import { GridsterItem } from './gridsterItem.interface';
import * as i0 from "@angular/core";
export declare class GridsterPreviewComponent implements OnInit, OnDestroy {
    private renderer;
    previewStyle$: EventEmitter<GridsterItem | null>;
    gridRenderer: GridsterRenderer;
    private el;
    private sub;
    constructor(el: ElementRef, renderer: Renderer2);
    ngOnInit(): void;
    ngOnDestroy(): void;
    private previewStyle;
    static ɵfac: i0.ɵɵFactoryDeclaration<GridsterPreviewComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<GridsterPreviewComponent, "gridster-preview", never, { "previewStyle$": "previewStyle$"; "gridRenderer": "gridRenderer"; }, {}, never, never, false>;
}
