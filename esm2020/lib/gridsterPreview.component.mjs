import { Component, ElementRef, EventEmitter, Input, Renderer2, ViewEncapsulation } from '@angular/core';
import { GridsterRenderer } from './gridsterRenderer.service';
import * as i0 from "@angular/core";
export class GridsterPreviewComponent {
    constructor(el, renderer) {
        this.renderer = renderer;
        this.el = el.nativeElement;
    }
    ngOnInit() {
        this.sub = this.previewStyle$.subscribe(options => this.previewStyle(options));
    }
    ngOnDestroy() {
        if (this.sub) {
            this.sub.unsubscribe();
        }
    }
    previewStyle(item) {
        if (item) {
            this.renderer.setStyle(this.el, 'display', 'block');
            this.gridRenderer.updateItem(this.el, item, this.renderer);
        }
        else {
            this.renderer.setStyle(this.el, 'display', '');
        }
    }
}
GridsterPreviewComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.6", ngImport: i0, type: GridsterPreviewComponent, deps: [{ token: i0.ElementRef }, { token: i0.Renderer2 }], target: i0.ɵɵFactoryTarget.Component });
GridsterPreviewComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "14.2.6", type: GridsterPreviewComponent, selector: "gridster-preview", inputs: { previewStyle$: "previewStyle$", gridRenderer: "gridRenderer" }, ngImport: i0, template: '', isInline: true, styles: ["gridster-preview{position:absolute;display:none;background:rgba(0,0,0,.15)}\n"], encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.6", ngImport: i0, type: GridsterPreviewComponent, decorators: [{
            type: Component,
            args: [{ selector: 'gridster-preview', template: '', encapsulation: ViewEncapsulation.None, styles: ["gridster-preview{position:absolute;display:none;background:rgba(0,0,0,.15)}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.Renderer2 }]; }, propDecorators: { previewStyle$: [{
                type: Input
            }], gridRenderer: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZHN0ZXJQcmV2aWV3LmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2FuZ3VsYXItZ3JpZHN0ZXIyL3NyYy9saWIvZ3JpZHN0ZXJQcmV2aWV3LmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osS0FBSyxFQUdMLFNBQVMsRUFDVCxpQkFBaUIsRUFDbEIsTUFBTSxlQUFlLENBQUM7QUFFdkIsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sNEJBQTRCLENBQUM7O0FBUzlELE1BQU0sT0FBTyx3QkFBd0I7SUFNbkMsWUFBWSxFQUFjLEVBQVUsUUFBbUI7UUFBbkIsYUFBUSxHQUFSLFFBQVEsQ0FBVztRQUNyRCxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUM7SUFDN0IsQ0FBQztJQUVELFFBQVE7UUFDTixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQ2hELElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQzNCLENBQUM7SUFDSixDQUFDO0lBRUQsV0FBVztRQUNULElBQUcsSUFBSSxDQUFDLEdBQUcsRUFBQztZQUNWLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUM7U0FDeEI7SUFDSCxDQUFDO0lBRU8sWUFBWSxDQUFDLElBQXlCO1FBQzVDLElBQUksSUFBSSxFQUFFO1lBQ1IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDcEQsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQzVEO2FBQU07WUFDTCxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztTQUNoRDtJQUNILENBQUM7O3FIQTdCVSx3QkFBd0I7eUdBQXhCLHdCQUF3QixrSUFKekIsRUFBRTsyRkFJRCx3QkFBd0I7a0JBTnBDLFNBQVM7K0JBQ0Usa0JBQWtCLFlBQ2xCLEVBQUUsaUJBRUcsaUJBQWlCLENBQUMsSUFBSTt5SEFHNUIsYUFBYTtzQkFBckIsS0FBSztnQkFDRyxZQUFZO3NCQUFwQixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQ29tcG9uZW50LFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIElucHV0LFxuICBPbkRlc3Ryb3ksXG4gIE9uSW5pdCxcbiAgUmVuZGVyZXIyLFxuICBWaWV3RW5jYXBzdWxhdGlvblxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgR3JpZHN0ZXJSZW5kZXJlciB9IGZyb20gJy4vZ3JpZHN0ZXJSZW5kZXJlci5zZXJ2aWNlJztcbmltcG9ydCB7IEdyaWRzdGVySXRlbSB9IGZyb20gJy4vZ3JpZHN0ZXJJdGVtLmludGVyZmFjZSc7XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2dyaWRzdGVyLXByZXZpZXcnLFxuICB0ZW1wbGF0ZTogJycsXG4gIHN0eWxlVXJsczogWycuL2dyaWRzdGVyUHJldmlldy5jc3MnXSxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZVxufSlcbmV4cG9ydCBjbGFzcyBHcmlkc3RlclByZXZpZXdDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIE9uRGVzdHJveSB7XG4gIEBJbnB1dCgpIHByZXZpZXdTdHlsZSQ6IEV2ZW50RW1pdHRlcjxHcmlkc3Rlckl0ZW0gfCBudWxsPjtcbiAgQElucHV0KCkgZ3JpZFJlbmRlcmVyOiBHcmlkc3RlclJlbmRlcmVyO1xuICBwcml2YXRlIGVsOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBzdWI6IFN1YnNjcmlwdGlvbjtcblxuICBjb25zdHJ1Y3RvcihlbDogRWxlbWVudFJlZiwgcHJpdmF0ZSByZW5kZXJlcjogUmVuZGVyZXIyKSB7XG4gICAgdGhpcy5lbCA9IGVsLm5hdGl2ZUVsZW1lbnQ7XG4gIH1cblxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLnN1YiA9IHRoaXMucHJldmlld1N0eWxlJC5zdWJzY3JpYmUob3B0aW9ucyA9PlxuICAgICAgdGhpcy5wcmV2aWV3U3R5bGUob3B0aW9ucylcbiAgICApO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKTogdm9pZCB7XG4gICAgaWYodGhpcy5zdWIpe1xuICAgICAgdGhpcy5zdWIudW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHByZXZpZXdTdHlsZShpdGVtOiBHcmlkc3Rlckl0ZW0gfCBudWxsKTogdm9pZCB7XG4gICAgaWYgKGl0ZW0pIHtcbiAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5lbCwgJ2Rpc3BsYXknLCAnYmxvY2snKTtcbiAgICAgIHRoaXMuZ3JpZFJlbmRlcmVyLnVwZGF0ZUl0ZW0odGhpcy5lbCwgaXRlbSwgdGhpcy5yZW5kZXJlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5lbCwgJ2Rpc3BsYXknLCAnJyk7XG4gICAgfVxuICB9XG59XG4iXX0=