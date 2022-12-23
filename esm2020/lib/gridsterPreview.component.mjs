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
        this.sub.unsubscribe();
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
GridsterPreviewComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.0.1", ngImport: i0, type: GridsterPreviewComponent, deps: [{ token: i0.ElementRef }, { token: i0.Renderer2 }], target: i0.ɵɵFactoryTarget.Component });
GridsterPreviewComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.0.1", type: GridsterPreviewComponent, isStandalone: true, selector: "gridster-preview", inputs: { previewStyle$: "previewStyle$", gridRenderer: "gridRenderer" }, ngImport: i0, template: '', isInline: true, styles: ["gridster-preview{position:absolute;display:none;background:rgba(0,0,0,.15)}\n"], encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.0.1", ngImport: i0, type: GridsterPreviewComponent, decorators: [{
            type: Component,
            args: [{ selector: 'gridster-preview', template: '', encapsulation: ViewEncapsulation.None, standalone: true, styles: ["gridster-preview{position:absolute;display:none;background:rgba(0,0,0,.15)}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.Renderer2 }]; }, propDecorators: { previewStyle$: [{
                type: Input
            }], gridRenderer: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZHN0ZXJQcmV2aWV3LmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2FuZ3VsYXItZ3JpZHN0ZXIyL3NyYy9saWIvZ3JpZHN0ZXJQcmV2aWV3LmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osS0FBSyxFQUdMLFNBQVMsRUFDVCxpQkFBaUIsRUFDbEIsTUFBTSxlQUFlLENBQUM7QUFHdkIsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sNEJBQTRCLENBQUM7O0FBUzlELE1BQU0sT0FBTyx3QkFBd0I7SUFNbkMsWUFBWSxFQUFjLEVBQVUsUUFBbUI7UUFBbkIsYUFBUSxHQUFSLFFBQVEsQ0FBVztRQUNyRCxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUM7SUFDN0IsQ0FBQztJQUVELFFBQVE7UUFDTixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQ2hELElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQzNCLENBQUM7SUFDSixDQUFDO0lBRUQsV0FBVztRQUNULElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDekIsQ0FBQztJQUVPLFlBQVksQ0FBQyxJQUF5QjtRQUM1QyxJQUFJLElBQUksRUFBRTtZQUNSLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3BELElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUM1RDthQUFNO1lBQ0wsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDaEQ7SUFDSCxDQUFDOztxSEEzQlUsd0JBQXdCO3lHQUF4Qix3QkFBd0Isc0pBTHpCLEVBQUU7MkZBS0Qsd0JBQXdCO2tCQVBwQyxTQUFTOytCQUNFLGtCQUFrQixZQUNsQixFQUFFLGlCQUVHLGlCQUFpQixDQUFDLElBQUksY0FDekIsSUFBSTt5SEFHUCxhQUFhO3NCQUFyQixLQUFLO2dCQUNHLFlBQVk7c0JBQXBCLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBDb21wb25lbnQsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5wdXQsXG4gIE9uRGVzdHJveSxcbiAgT25Jbml0LFxuICBSZW5kZXJlcjIsXG4gIFZpZXdFbmNhcHN1bGF0aW9uXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBHcmlkc3Rlckl0ZW0gfSBmcm9tICcuL2dyaWRzdGVySXRlbS5pbnRlcmZhY2UnO1xuaW1wb3J0IHsgR3JpZHN0ZXJSZW5kZXJlciB9IGZyb20gJy4vZ3JpZHN0ZXJSZW5kZXJlci5zZXJ2aWNlJztcblxuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnZ3JpZHN0ZXItcHJldmlldycsXG4gIHRlbXBsYXRlOiAnJyxcbiAgc3R5bGVVcmxzOiBbJy4vZ3JpZHN0ZXJQcmV2aWV3LmNzcyddLFxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxuICBzdGFuZGFsb25lOiB0cnVlXG59KVxuZXhwb3J0IGNsYXNzIEdyaWRzdGVyUHJldmlld0NvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgT25EZXN0cm95IHtcbiAgQElucHV0KCkgcHJldmlld1N0eWxlJDogRXZlbnRFbWl0dGVyPEdyaWRzdGVySXRlbSB8IG51bGw+O1xuICBASW5wdXQoKSBncmlkUmVuZGVyZXI6IEdyaWRzdGVyUmVuZGVyZXI7XG4gIHByaXZhdGUgZWw6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIHN1YjogU3Vic2NyaXB0aW9uO1xuXG4gIGNvbnN0cnVjdG9yKGVsOiBFbGVtZW50UmVmLCBwcml2YXRlIHJlbmRlcmVyOiBSZW5kZXJlcjIpIHtcbiAgICB0aGlzLmVsID0gZWwubmF0aXZlRWxlbWVudDtcbiAgfVxuXG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuc3ViID0gdGhpcy5wcmV2aWV3U3R5bGUkLnN1YnNjcmliZShvcHRpb25zID0+XG4gICAgICB0aGlzLnByZXZpZXdTdHlsZShvcHRpb25zKVxuICAgICk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLnN1Yi51bnN1YnNjcmliZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBwcmV2aWV3U3R5bGUoaXRlbTogR3JpZHN0ZXJJdGVtIHwgbnVsbCk6IHZvaWQge1xuICAgIGlmIChpdGVtKSB7XG4gICAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKHRoaXMuZWwsICdkaXNwbGF5JywgJ2Jsb2NrJyk7XG4gICAgICB0aGlzLmdyaWRSZW5kZXJlci51cGRhdGVJdGVtKHRoaXMuZWwsIGl0ZW0sIHRoaXMucmVuZGVyZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKHRoaXMuZWwsICdkaXNwbGF5JywgJycpO1xuICAgIH1cbiAgfVxufVxuIl19