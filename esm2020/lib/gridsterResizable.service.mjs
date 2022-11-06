import { DirTypes } from './gridsterConfig.interface';
import { GridsterPush } from './gridsterPush.service';
import { GridsterPushResize } from './gridsterPushResize.service';
import { cancelScroll, scroll } from './gridsterScroll.service';
import { GridsterUtils } from './gridsterUtils.service';
export class GridsterResizable {
    constructor(gridsterItem, gridster, zone) {
        this.zone = zone;
        /**
         * The direction function may reference any of the `GridsterResizable` class methods, that are
         * responsible for gridster resize when the `dragmove` event is being handled. E.g. it may reference
         * the `handleNorth` method when the north handle is pressed and moved by a mouse.
         */
        this.directionFunction = null;
        this.dragMove = (e) => {
            if (this.directionFunction === null) {
                throw new Error('The `directionFunction` has not been set before calling `dragMove`.');
            }
            e.stopPropagation();
            e.preventDefault();
            GridsterUtils.checkTouchEvent(e);
            this.offsetTop = this.gridster.el.scrollTop - this.gridster.el.offsetTop;
            this.offsetLeft = this.gridster.el.scrollLeft - this.gridster.el.offsetLeft;
            scroll(this.gridster, this.left, this.top, this.width, this.height, e, this.lastMouse, this.directionFunction, true, this.resizeEventScrollType);
            const scale = this.gridster.options.scale || 1;
            this.directionFunction({
                clientX: this.originalClientX + (e.clientX - this.originalClientX) / scale,
                clientY: this.originalClientY + (e.clientY - this.originalClientY) / scale
            });
            this.lastMouse.clientX = e.clientX;
            this.lastMouse.clientY = e.clientY;
            this.zone.run(() => {
                this.gridster.updateGrid();
            });
        };
        this.dragStop = (e) => {
            e.stopPropagation();
            e.preventDefault();
            cancelScroll();
            this.mousemove();
            this.mouseup();
            this.mouseleave();
            this.cancelOnBlur();
            this.touchmove();
            this.touchend();
            this.touchcancel();
            this.gridster.dragInProgress = false;
            this.gridster.updateGrid();
            if (this.gridster.options.resizable &&
                this.gridster.options.resizable.stop) {
                Promise.resolve(this.gridster.options.resizable.stop(this.gridsterItem.item, this.gridsterItem, e)).then(this.makeResize, this.cancelResize);
            }
            else {
                this.makeResize();
            }
            setTimeout(() => {
                this.gridsterItem.renderer.removeClass(this.gridsterItem.el, 'gridster-item-resizing');
                if (this.gridster) {
                    this.gridster.movingItem = null;
                    this.gridster.previewStyle();
                }
            });
        };
        this.cancelResize = () => {
            this.gridsterItem.$item.cols = this.gridsterItem.item.cols || 1;
            this.gridsterItem.$item.rows = this.gridsterItem.item.rows || 1;
            this.gridsterItem.$item.x = this.gridsterItem.item.x || 0;
            this.gridsterItem.$item.y = this.gridsterItem.item.y || 0;
            this.gridsterItem.setSize();
            this.push.restoreItems();
            this.pushResize.restoreItems();
            this.push.destroy();
            this.push = null;
            this.pushResize.destroy();
            this.pushResize = null;
        };
        this.makeResize = () => {
            this.gridsterItem.setSize();
            this.gridsterItem.checkItemChanges(this.gridsterItem.$item, this.gridsterItem.item);
            this.push.setPushedItems();
            this.pushResize.setPushedItems();
            this.push.destroy();
            this.push = null;
            this.pushResize.destroy();
            this.pushResize = null;
        };
        this.handleNorth = (e) => {
            this.top = e.clientY + this.offsetTop - this.diffTop;
            this.height = this.bottom - this.top;
            if (this.minHeight > this.height) {
                this.height = this.minHeight;
                this.top = this.bottom - this.minHeight;
            }
            this.newPosition = this.gridster.pixelsToPositionY(this.top + this.margin, Math.floor);
            if (this.gridsterItem.$item.y !== this.newPosition) {
                this.itemBackup[1] = this.gridsterItem.$item.y;
                this.itemBackup[3] = this.gridsterItem.$item.rows;
                this.gridsterItem.$item.rows +=
                    this.gridsterItem.$item.y - this.newPosition;
                this.gridsterItem.$item.y = this.newPosition;
                this.pushResize.pushItems(this.pushResize.fromSouth);
                this.push.pushItems(this.push.fromSouth, this.gridster.$options.disablePushOnResize);
                if (this.gridster.checkCollision(this.gridsterItem.$item)) {
                    this.gridsterItem.$item.y = this.itemBackup[1];
                    this.gridsterItem.$item.rows = this.itemBackup[3];
                    this.setItemTop(this.gridster.positionYToPixels(this.gridsterItem.$item.y));
                    this.setItemHeight(this.gridster.positionYToPixels(this.gridsterItem.$item.rows) -
                        this.margin);
                    return;
                }
                else {
                    this.gridster.previewStyle();
                }
                this.pushResize.checkPushBack();
                this.push.checkPushBack();
            }
            this.setItemTop(this.top);
            this.setItemHeight(this.height);
        };
        this.handleWest = (e) => {
            const clientX = this.gridster.$options.dirType === DirTypes.RTL
                ? this.originalClientX + (this.originalClientX - e.clientX)
                : e.clientX;
            this.left = clientX + this.offsetLeft - this.diffLeft;
            this.width = this.right - this.left;
            if (this.minWidth > this.width) {
                this.width = this.minWidth;
                this.left = this.right - this.minWidth;
            }
            this.newPosition = this.gridster.pixelsToPositionX(this.left + this.margin, Math.floor);
            if (this.gridsterItem.$item.x !== this.newPosition) {
                this.itemBackup[0] = this.gridsterItem.$item.x;
                this.itemBackup[2] = this.gridsterItem.$item.cols;
                this.gridsterItem.$item.cols +=
                    this.gridsterItem.$item.x - this.newPosition;
                this.gridsterItem.$item.x = this.newPosition;
                this.pushResize.pushItems(this.pushResize.fromEast);
                this.push.pushItems(this.push.fromEast, this.gridster.$options.disablePushOnResize);
                if (this.gridster.checkCollision(this.gridsterItem.$item)) {
                    this.gridsterItem.$item.x = this.itemBackup[0];
                    this.gridsterItem.$item.cols = this.itemBackup[2];
                    this.setItemLeft(this.gridster.positionXToPixels(this.gridsterItem.$item.x));
                    this.setItemWidth(this.gridster.positionXToPixels(this.gridsterItem.$item.cols) -
                        this.margin);
                    return;
                }
                else {
                    this.gridster.previewStyle();
                }
                this.pushResize.checkPushBack();
                this.push.checkPushBack();
            }
            this.setItemLeft(this.left);
            this.setItemWidth(this.width);
        };
        this.handleSouth = (e) => {
            this.height = e.clientY + this.offsetTop - this.diffBottom - this.top;
            if (this.minHeight > this.height) {
                this.height = this.minHeight;
            }
            this.bottom = this.top + this.height;
            this.newPosition = this.gridster.pixelsToPositionY(this.bottom, Math.ceil);
            if (this.gridsterItem.$item.y + this.gridsterItem.$item.rows !==
                this.newPosition) {
                this.itemBackup[3] = this.gridsterItem.$item.rows;
                this.gridsterItem.$item.rows =
                    this.newPosition - this.gridsterItem.$item.y;
                this.pushResize.pushItems(this.pushResize.fromNorth);
                this.push.pushItems(this.push.fromNorth, this.gridster.$options.disablePushOnResize);
                if (this.gridster.checkCollision(this.gridsterItem.$item)) {
                    this.gridsterItem.$item.rows = this.itemBackup[3];
                    this.setItemHeight(this.gridster.positionYToPixels(this.gridsterItem.$item.rows) -
                        this.margin);
                    return;
                }
                else {
                    this.gridster.previewStyle();
                }
                this.pushResize.checkPushBack();
                this.push.checkPushBack();
            }
            this.setItemHeight(this.height);
        };
        this.handleEast = (e) => {
            const clientX = this.gridster.$options.dirType === DirTypes.RTL
                ? this.originalClientX + (this.originalClientX - e.clientX)
                : e.clientX;
            this.width = clientX + this.offsetLeft - this.diffRight - this.left;
            if (this.minWidth > this.width) {
                this.width = this.minWidth;
            }
            this.right = this.left + this.width;
            this.newPosition = this.gridster.pixelsToPositionX(this.right, Math.ceil);
            if (this.gridsterItem.$item.x + this.gridsterItem.$item.cols !==
                this.newPosition) {
                this.itemBackup[2] = this.gridsterItem.$item.cols;
                this.gridsterItem.$item.cols =
                    this.newPosition - this.gridsterItem.$item.x;
                this.pushResize.pushItems(this.pushResize.fromWest);
                this.push.pushItems(this.push.fromWest, this.gridster.$options.disablePushOnResize);
                if (this.gridster.checkCollision(this.gridsterItem.$item)) {
                    this.gridsterItem.$item.cols = this.itemBackup[2];
                    this.setItemWidth(this.gridster.positionXToPixels(this.gridsterItem.$item.cols) -
                        this.margin);
                    return;
                }
                else {
                    this.gridster.previewStyle();
                }
                this.pushResize.checkPushBack();
                this.push.checkPushBack();
            }
            this.setItemWidth(this.width);
        };
        this.handleNorthWest = (e) => {
            this.handleNorth(e);
            this.handleWest(e);
        };
        this.handleNorthEast = (e) => {
            this.handleNorth(e);
            this.handleEast(e);
        };
        this.handleSouthWest = (e) => {
            this.handleSouth(e);
            this.handleWest(e);
        };
        this.handleSouthEast = (e) => {
            this.handleSouth(e);
            this.handleEast(e);
        };
        this.gridsterItem = gridsterItem;
        this.gridster = gridster;
        this.lastMouse = {
            clientX: 0,
            clientY: 0
        };
        this.itemBackup = [0, 0, 0, 0];
        this.resizeEventScrollType = {
            west: false,
            east: false,
            north: false,
            south: false
        };
    }
    destroy() {
        this.gridster?.previewStyle();
        this.gridster = this.gridsterItem = null;
    }
    dragStart(e) {
        if (e.which && e.which !== 1) {
            return;
        }
        if (this.gridster.options.resizable &&
            this.gridster.options.resizable.start) {
            this.gridster.options.resizable.start(this.gridsterItem.item, this.gridsterItem, e);
        }
        e.stopPropagation();
        e.preventDefault();
        this.zone.runOutsideAngular(() => {
            this.mousemove = this.gridsterItem.renderer.listen('document', 'mousemove', this.dragMove);
            this.touchmove = this.gridster.renderer.listen(this.gridster.el, 'touchmove', this.dragMove);
        });
        this.mouseup = this.gridsterItem.renderer.listen('document', 'mouseup', this.dragStop);
        this.mouseleave = this.gridsterItem.renderer.listen('document', 'mouseleave', this.dragStop);
        this.cancelOnBlur = this.gridsterItem.renderer.listen('window', 'blur', this.dragStop);
        this.touchend = this.gridsterItem.renderer.listen('document', 'touchend', this.dragStop);
        this.touchcancel = this.gridsterItem.renderer.listen('document', 'touchcancel', this.dragStop);
        this.gridsterItem.renderer.addClass(this.gridsterItem.el, 'gridster-item-resizing');
        this.lastMouse.clientX = e.clientX;
        this.lastMouse.clientY = e.clientY;
        this.left = this.gridsterItem.left;
        this.top = this.gridsterItem.top;
        this.originalClientX = e.clientX;
        this.originalClientY = e.clientY;
        this.width = this.gridsterItem.width;
        this.height = this.gridsterItem.height;
        this.bottom = this.gridsterItem.top + this.gridsterItem.height;
        this.right = this.gridsterItem.left + this.gridsterItem.width;
        this.margin = this.gridster.$options.margin;
        this.offsetLeft = this.gridster.el.scrollLeft - this.gridster.el.offsetLeft;
        this.offsetTop = this.gridster.el.scrollTop - this.gridster.el.offsetTop;
        this.diffLeft = e.clientX + this.offsetLeft - this.left;
        this.diffRight = e.clientX + this.offsetLeft - this.right;
        this.diffTop = e.clientY + this.offsetTop - this.top;
        this.diffBottom = e.clientY + this.offsetTop - this.bottom;
        this.minHeight =
            this.gridster.positionYToPixels(this.gridsterItem.$item.minItemRows ||
                this.gridster.$options.minItemRows) - this.margin;
        this.minWidth =
            this.gridster.positionXToPixels(this.gridsterItem.$item.minItemCols ||
                this.gridster.$options.minItemCols) - this.margin;
        this.gridster.movingItem = this.gridsterItem.$item;
        this.gridster.previewStyle();
        this.push = new GridsterPush(this.gridsterItem);
        this.pushResize = new GridsterPushResize(this.gridsterItem);
        this.gridster.dragInProgress = true;
        this.gridster.updateGrid();
        const { classList } = e.target;
        if (classList.contains('handle-n')) {
            this.resizeEventScrollType.north = true;
            this.directionFunction = this.handleNorth;
        }
        else if (classList.contains('handle-w')) {
            if (this.gridster.$options.dirType === DirTypes.RTL) {
                this.resizeEventScrollType.east = true;
                this.directionFunction = this.handleEast;
            }
            else {
                this.resizeEventScrollType.west = true;
                this.directionFunction = this.handleWest;
            }
        }
        else if (classList.contains('handle-s')) {
            this.resizeEventScrollType.south = true;
            this.directionFunction = this.handleSouth;
        }
        else if (classList.contains('handle-e')) {
            if (this.gridster.$options.dirType === DirTypes.RTL) {
                this.resizeEventScrollType.west = true;
                this.directionFunction = this.handleWest;
            }
            else {
                this.resizeEventScrollType.east = true;
                this.directionFunction = this.handleEast;
            }
        }
        else if (classList.contains('handle-nw')) {
            if (this.gridster.$options.dirType === DirTypes.RTL) {
                this.resizeEventScrollType.north = true;
                this.resizeEventScrollType.east = true;
                this.directionFunction = this.handleNorthEast;
            }
            else {
                this.resizeEventScrollType.north = true;
                this.resizeEventScrollType.west = true;
                this.directionFunction = this.handleNorthWest;
            }
        }
        else if (classList.contains('handle-ne')) {
            if (this.gridster.$options.dirType === DirTypes.RTL) {
                this.resizeEventScrollType.north = true;
                this.resizeEventScrollType.west = true;
                this.directionFunction = this.handleNorthWest;
            }
            else {
                this.resizeEventScrollType.north = true;
                this.resizeEventScrollType.east = true;
                this.directionFunction = this.handleNorthEast;
            }
        }
        else if (classList.contains('handle-sw')) {
            if (this.gridster.$options.dirType === DirTypes.RTL) {
                this.resizeEventScrollType.south = true;
                this.resizeEventScrollType.east = true;
                this.directionFunction = this.handleSouthEast;
            }
            else {
                this.resizeEventScrollType.south = true;
                this.resizeEventScrollType.west = true;
                this.directionFunction = this.handleSouthWest;
            }
        }
        else if (classList.contains('handle-se')) {
            if (this.gridster.$options.dirType === DirTypes.RTL) {
                this.resizeEventScrollType.south = true;
                this.resizeEventScrollType.west = true;
                this.directionFunction = this.handleSouthWest;
            }
            else {
                this.resizeEventScrollType.south = true;
                this.resizeEventScrollType.east = true;
                this.directionFunction = this.handleSouthEast;
            }
        }
    }
    toggle() {
        this.resizeEnabled = this.gridsterItem.canBeResized();
        this.resizableHandles = this.gridsterItem.getResizableHandles();
    }
    dragStartDelay(e) {
        GridsterUtils.checkTouchEvent(e);
        if (!this.gridster.$options.resizable.delayStart) {
            this.dragStart(e);
            return;
        }
        const timeout = setTimeout(() => {
            this.dragStart(e);
            cancelDrag();
        }, this.gridster.$options.resizable.delayStart);
        const { cancelMouse, cancelMouseLeave, cancelOnBlur, cancelTouchMove, cancelTouchEnd, cancelTouchCancel } = this.zone.runOutsideAngular(() => {
            // Note: all of these events are being added within the `<root>` zone since they all
            // don't do any view updates and don't require Angular running change detection.
            // All event listeners call `cancelDrag` once the event is dispatched, the `cancelDrag`
            // is responsible only for removing event listeners.
            const cancelMouse = this.gridsterItem.renderer.listen('document', 'mouseup', cancelDrag);
            const cancelMouseLeave = this.gridsterItem.renderer.listen('document', 'mouseleave', cancelDrag);
            const cancelOnBlur = this.gridsterItem.renderer.listen('window', 'blur', cancelDrag);
            const cancelTouchMove = this.gridsterItem.renderer.listen('document', 'touchmove', cancelMove);
            const cancelTouchEnd = this.gridsterItem.renderer.listen('document', 'touchend', cancelDrag);
            const cancelTouchCancel = this.gridsterItem.renderer.listen('document', 'touchcancel', cancelDrag);
            return {
                cancelMouse,
                cancelMouseLeave,
                cancelOnBlur,
                cancelTouchMove,
                cancelTouchEnd,
                cancelTouchCancel
            };
        });
        function cancelMove(eventMove) {
            GridsterUtils.checkTouchEvent(eventMove);
            if (Math.abs(eventMove.clientX - e.clientX) > 9 ||
                Math.abs(eventMove.clientY - e.clientY) > 9) {
                cancelDrag();
            }
        }
        function cancelDrag() {
            clearTimeout(timeout);
            cancelOnBlur();
            cancelMouse();
            cancelMouseLeave();
            cancelTouchMove();
            cancelTouchEnd();
            cancelTouchCancel();
        }
    }
    setItemTop(top) {
        this.gridster.gridRenderer.setCellPosition(this.gridsterItem.renderer, this.gridsterItem.el, this.left, top);
    }
    setItemLeft(left) {
        this.gridster.gridRenderer.setCellPosition(this.gridsterItem.renderer, this.gridsterItem.el, left, this.top);
    }
    setItemHeight(height) {
        this.gridsterItem.renderer.setStyle(this.gridsterItem.el, 'height', height + 'px');
    }
    setItemWidth(width) {
        this.gridsterItem.renderer.setStyle(this.gridsterItem.el, 'width', width + 'px');
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZHN0ZXJSZXNpemFibGUuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2FuZ3VsYXItZ3JpZHN0ZXIyL3NyYy9saWIvZ3JpZHN0ZXJSZXNpemFibGUuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFFdEQsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBQ3RELE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLDhCQUE4QixDQUFDO0FBR2xFLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDaEUsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBRXhELE1BQU0sT0FBTyxpQkFBaUI7SUEwRDVCLFlBQ0UsWUFBNEMsRUFDNUMsUUFBb0MsRUFDNUIsSUFBWTtRQUFaLFNBQUksR0FBSixJQUFJLENBQVE7UUFuRHRCOzs7O1dBSUc7UUFDSyxzQkFBaUIsR0FFZCxJQUFJLENBQUM7UUFrT2hCLGFBQVEsR0FBRyxDQUFDLENBQWEsRUFBUSxFQUFFO1lBQ2pDLElBQUksSUFBSSxDQUFDLGlCQUFpQixLQUFLLElBQUksRUFBRTtnQkFDbkMsTUFBTSxJQUFJLEtBQUssQ0FDYixxRUFBcUUsQ0FDdEUsQ0FBQzthQUNIO1lBRUQsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ3BCLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNuQixhQUFhLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQztZQUN6RSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUM7WUFDNUUsTUFBTSxDQUNKLElBQUksQ0FBQyxRQUFRLEVBQ2IsSUFBSSxDQUFDLElBQUksRUFDVCxJQUFJLENBQUMsR0FBRyxFQUNSLElBQUksQ0FBQyxLQUFLLEVBQ1YsSUFBSSxDQUFDLE1BQU0sRUFDWCxDQUFDLEVBQ0QsSUFBSSxDQUFDLFNBQVMsRUFDZCxJQUFJLENBQUMsaUJBQWlCLEVBQ3RCLElBQUksRUFDSixJQUFJLENBQUMscUJBQXFCLENBQzNCLENBQUM7WUFFRixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDO1lBQy9DLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztnQkFDckIsT0FBTyxFQUNMLElBQUksQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxLQUFLO2dCQUNuRSxPQUFPLEVBQUUsSUFBSSxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLEtBQUs7YUFDM0UsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztZQUNuQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDO1lBQ25DLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRTtnQkFDakIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUM3QixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQztRQUVGLGFBQVEsR0FBRyxDQUFDLENBQWEsRUFBUSxFQUFFO1lBQ2pDLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUNwQixDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDbkIsWUFBWSxFQUFFLENBQUM7WUFDZixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDakIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2YsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDakIsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNuQixJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7WUFDckMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUMzQixJQUNFLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFNBQVM7Z0JBQy9CLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQ3BDO2dCQUNBLE9BQU8sQ0FBQyxPQUFPLENBQ2IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FDbEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQ3RCLElBQUksQ0FBQyxZQUFZLEVBQ2pCLENBQUMsQ0FDRixDQUNGLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO2FBQzVDO2lCQUFNO2dCQUNMLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQzthQUNuQjtZQUNELFVBQVUsQ0FBQyxHQUFHLEVBQUU7Z0JBQ2QsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUNwQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsRUFDcEIsd0JBQXdCLENBQ3pCLENBQUM7Z0JBQ0YsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO29CQUNqQixJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7b0JBQ2hDLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLENBQUM7aUJBQzlCO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUM7UUFFRixpQkFBWSxHQUFHLEdBQVMsRUFBRTtZQUN4QixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQztZQUNoRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQztZQUNoRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMxRCxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMxRCxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzVCLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDekIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUMvQixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSyxDQUFDO1lBQ2xCLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDMUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFLLENBQUM7UUFDMUIsQ0FBQyxDQUFDO1FBRUYsZUFBVSxHQUFHLEdBQVMsRUFBRTtZQUN0QixJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzVCLElBQUksQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLENBQ2hDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUN2QixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FDdkIsQ0FBQztZQUNGLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDM0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNqQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSyxDQUFDO1lBQ2xCLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDMUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFLLENBQUM7UUFDMUIsQ0FBQyxDQUFDO1FBRU0sZ0JBQVcsR0FBRyxDQUFDLENBQWEsRUFBUSxFQUFFO1lBQzVDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDckQsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDckMsSUFBSSxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQ2hDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7YUFDekM7WUFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQ2hELElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFDdEIsSUFBSSxDQUFDLEtBQUssQ0FDWCxDQUFDO1lBQ0YsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLFdBQVcsRUFBRTtnQkFDbEQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO2dCQUNsRCxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJO29CQUMxQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7Z0JBQzdDLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3JELElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUNqQixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFDbkIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQzNDLENBQUM7Z0JBQ0YsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUN6RCxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDL0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2xELElBQUksQ0FBQyxVQUFVLENBQ2IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FDM0QsQ0FBQztvQkFDRixJQUFJLENBQUMsYUFBYSxDQUNoQixJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQzt3QkFDM0QsSUFBSSxDQUFDLE1BQU0sQ0FDZCxDQUFDO29CQUNGLE9BQU87aUJBQ1I7cUJBQU07b0JBQ0wsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsQ0FBQztpQkFDOUI7Z0JBQ0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDaEMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQzthQUMzQjtZQUNELElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzFCLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2xDLENBQUMsQ0FBQztRQUVNLGVBQVUsR0FBRyxDQUFDLENBQWEsRUFBUSxFQUFFO1lBQzNDLE1BQU0sT0FBTyxHQUNYLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sS0FBSyxRQUFRLENBQUMsR0FBRztnQkFDN0MsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLEdBQUcsQ0FBQyxJQUFJLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUM7Z0JBQzNELENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO1lBQ2hCLElBQUksQ0FBQyxJQUFJLEdBQUcsT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUV0RCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztZQUNwQyxJQUFJLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFDOUIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO2dCQUMzQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQzthQUN4QztZQUNELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FDaEQsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxFQUN2QixJQUFJLENBQUMsS0FBSyxDQUNYLENBQUM7WUFDRixJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsV0FBVyxFQUFFO2dCQUNsRCxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQ2xELElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLElBQUk7b0JBQzFCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO2dCQUMvQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztnQkFDN0MsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUNsQixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FDM0MsQ0FBQztnQkFDRixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEVBQUU7b0JBQ3pELElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMvQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDbEQsSUFBSSxDQUFDLFdBQVcsQ0FDZCxJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUMzRCxDQUFDO29CQUNGLElBQUksQ0FBQyxZQUFZLENBQ2YsSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7d0JBQzNELElBQUksQ0FBQyxNQUFNLENBQ2QsQ0FBQztvQkFDRixPQUFPO2lCQUNSO3FCQUFNO29CQUNMLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLENBQUM7aUJBQzlCO2dCQUNELElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ2hDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7YUFDM0I7WUFDRCxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM1QixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoQyxDQUFDLENBQUM7UUFFTSxnQkFBVyxHQUFHLENBQUMsQ0FBYSxFQUFRLEVBQUU7WUFDNUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQ3RFLElBQUksSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFO2dCQUNoQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7YUFDOUI7WUFDRCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUNyQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0UsSUFDRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSTtnQkFDeEQsSUFBSSxDQUFDLFdBQVcsRUFDaEI7Z0JBQ0EsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQ2xELElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLElBQUk7b0JBQzFCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUMvQyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNyRCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FDakIsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQ25CLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUMzQyxDQUFDO2dCQUNGLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsRUFBRTtvQkFDekQsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2xELElBQUksQ0FBQyxhQUFhLENBQ2hCLElBQUksQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO3dCQUMzRCxJQUFJLENBQUMsTUFBTSxDQUNkLENBQUM7b0JBQ0YsT0FBTztpQkFDUjtxQkFBTTtvQkFDTCxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSxDQUFDO2lCQUM5QjtnQkFDRCxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2FBQzNCO1lBQ0QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbEMsQ0FBQyxDQUFDO1FBRU0sZUFBVSxHQUFHLENBQUMsQ0FBYSxFQUFRLEVBQUU7WUFDM0MsTUFBTSxPQUFPLEdBQ1gsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxLQUFLLFFBQVEsQ0FBQyxHQUFHO2dCQUM3QyxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsR0FBRyxDQUFDLElBQUksQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztnQkFDM0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7WUFDaEIsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7WUFFcEUsSUFBSSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUU7Z0JBQzlCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQzthQUM1QjtZQUNELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMxRSxJQUNFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJO2dCQUN4RCxJQUFJLENBQUMsV0FBVyxFQUNoQjtnQkFDQSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztnQkFDbEQsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSTtvQkFDMUIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3BELElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUNqQixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFDbEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQzNDLENBQUM7Z0JBQ0YsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUN6RCxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDbEQsSUFBSSxDQUFDLFlBQVksQ0FDZixJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQzt3QkFDM0QsSUFBSSxDQUFDLE1BQU0sQ0FDZCxDQUFDO29CQUNGLE9BQU87aUJBQ1I7cUJBQU07b0JBQ0wsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsQ0FBQztpQkFDOUI7Z0JBQ0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDaEMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQzthQUMzQjtZQUNELElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hDLENBQUMsQ0FBQztRQUVNLG9CQUFlLEdBQUcsQ0FBQyxDQUFhLEVBQVEsRUFBRTtZQUNoRCxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckIsQ0FBQyxDQUFDO1FBRU0sb0JBQWUsR0FBRyxDQUFDLENBQWEsRUFBUSxFQUFFO1lBQ2hELElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyQixDQUFDLENBQUM7UUFFTSxvQkFBZSxHQUFHLENBQUMsQ0FBYSxFQUFRLEVBQUU7WUFDaEQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwQixJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLENBQUMsQ0FBQztRQUVNLG9CQUFlLEdBQUcsQ0FBQyxDQUFhLEVBQVEsRUFBRTtZQUNoRCxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckIsQ0FBQyxDQUFDO1FBdGRBLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxTQUFTLEdBQUc7WUFDZixPQUFPLEVBQUUsQ0FBQztZQUNWLE9BQU8sRUFBRSxDQUFDO1NBQ1gsQ0FBQztRQUNGLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMvQixJQUFJLENBQUMscUJBQXFCLEdBQUc7WUFDM0IsSUFBSSxFQUFFLEtBQUs7WUFDWCxJQUFJLEVBQUUsS0FBSztZQUNYLEtBQUssRUFBRSxLQUFLO1lBQ1osS0FBSyxFQUFFLEtBQUs7U0FDYixDQUFDO0lBQ0osQ0FBQztJQUVELE9BQU87UUFDTCxJQUFJLENBQUMsUUFBUSxFQUFFLFlBQVksRUFBRSxDQUFDO1FBQzlCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFLLENBQUM7SUFDNUMsQ0FBQztJQUVELFNBQVMsQ0FBQyxDQUFhO1FBQ3JCLElBQUksQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUMsRUFBRTtZQUM1QixPQUFPO1NBQ1I7UUFDRCxJQUNFLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFNBQVM7WUFDL0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssRUFDckM7WUFDQSxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUNuQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFDdEIsSUFBSSxDQUFDLFlBQVksRUFDakIsQ0FBQyxDQUNGLENBQUM7U0FDSDtRQUNELENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUNwQixDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7UUFFbkIsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUU7WUFDL0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQ2hELFVBQVUsRUFDVixXQUFXLEVBQ1gsSUFBSSxDQUFDLFFBQVEsQ0FDZCxDQUFDO1lBQ0YsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQzVDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUNoQixXQUFXLEVBQ1gsSUFBSSxDQUFDLFFBQVEsQ0FDZCxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FDOUMsVUFBVSxFQUNWLFNBQVMsRUFDVCxJQUFJLENBQUMsUUFBUSxDQUNkLENBQUM7UUFDRixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FDakQsVUFBVSxFQUNWLFlBQVksRUFDWixJQUFJLENBQUMsUUFBUSxDQUNkLENBQUM7UUFDRixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FDbkQsUUFBUSxFQUNSLE1BQU0sRUFDTixJQUFJLENBQUMsUUFBUSxDQUNkLENBQUM7UUFDRixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FDL0MsVUFBVSxFQUNWLFVBQVUsRUFDVixJQUFJLENBQUMsUUFBUSxDQUNkLENBQUM7UUFDRixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FDbEQsVUFBVSxFQUNWLGFBQWEsRUFDYixJQUFJLENBQUMsUUFBUSxDQUNkLENBQUM7UUFFRixJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQ2pDLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUNwQix3QkFBd0IsQ0FDekIsQ0FBQztRQUNGLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDbkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUNuQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDO1FBQ25DLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUM7UUFDakMsSUFBSSxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ2pDLElBQUksQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUNqQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUM7UUFDdkMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQztRQUMvRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1FBQzlELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO1FBQzVDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQztRQUM1RSxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUM7UUFDekUsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUN4RCxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQzFELElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDckQsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUMzRCxJQUFJLENBQUMsU0FBUztZQUNa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LENBQUM7SUFFRCxXQUFXLENBQUMsSUFBWTtRQUN0QixJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQ3hDLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUMxQixJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsRUFDcEIsSUFBSSxFQUNKLElBQUksQ0FBQyxHQUFHLENBQ1QsQ0FBQztJQUNKLENBQUM7SUFFRCxhQUFhLENBQUMsTUFBYztRQUMxQixJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQ2pDLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUNwQixRQUFRLEVBQ1IsTUFBTSxHQUFHLElBQUksQ0FDZCxDQUFDO0lBQ0osQ0FBQztJQUVELFlBQVksQ0FBQyxLQUFhO1FBQ3hCLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FDakMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLEVBQ3BCLE9BQU8sRUFDUCxLQUFLLEdBQUcsSUFBSSxDQUNiLENBQUM7SUFDSixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZ1pvbmUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEdyaWRzdGVyQ29tcG9uZW50SW50ZXJmYWNlIH0gZnJvbSAnLi9ncmlkc3Rlci5pbnRlcmZhY2UnO1xuaW1wb3J0IHsgRGlyVHlwZXMgfSBmcm9tICcuL2dyaWRzdGVyQ29uZmlnLmludGVyZmFjZSc7XG5pbXBvcnQgeyBHcmlkc3Rlckl0ZW1Db21wb25lbnRJbnRlcmZhY2UgfSBmcm9tICcuL2dyaWRzdGVySXRlbS5pbnRlcmZhY2UnO1xuaW1wb3J0IHsgR3JpZHN0ZXJQdXNoIH0gZnJvbSAnLi9ncmlkc3RlclB1c2guc2VydmljZSc7XG5pbXBvcnQgeyBHcmlkc3RlclB1c2hSZXNpemUgfSBmcm9tICcuL2dyaWRzdGVyUHVzaFJlc2l6ZS5zZXJ2aWNlJztcbmltcG9ydCB7IEdyaWRzdGVyUmVzaXplRXZlbnRUeXBlIH0gZnJvbSAnLi9ncmlkc3RlclJlc2l6ZUV2ZW50VHlwZS5pbnRlcmZhY2UnO1xuXG5pbXBvcnQgeyBjYW5jZWxTY3JvbGwsIHNjcm9sbCB9IGZyb20gJy4vZ3JpZHN0ZXJTY3JvbGwuc2VydmljZSc7XG5pbXBvcnQgeyBHcmlkc3RlclV0aWxzIH0gZnJvbSAnLi9ncmlkc3RlclV0aWxzLnNlcnZpY2UnO1xuXG5leHBvcnQgY2xhc3MgR3JpZHN0ZXJSZXNpemFibGUge1xuICBncmlkc3Rlckl0ZW06IEdyaWRzdGVySXRlbUNvbXBvbmVudEludGVyZmFjZTtcbiAgZ3JpZHN0ZXI6IEdyaWRzdGVyQ29tcG9uZW50SW50ZXJmYWNlO1xuICBsYXN0TW91c2U6IHtcbiAgICBjbGllbnRYOiBudW1iZXI7XG4gICAgY2xpZW50WTogbnVtYmVyO1xuICB9O1xuICBpdGVtQmFja3VwOiBudW1iZXJbXTtcbiAgcmVzaXplRXZlbnRTY3JvbGxUeXBlOiBHcmlkc3RlclJlc2l6ZUV2ZW50VHlwZTtcblxuICAvKipcbiAgICogVGhlIGRpcmVjdGlvbiBmdW5jdGlvbiBtYXkgcmVmZXJlbmNlIGFueSBvZiB0aGUgYEdyaWRzdGVyUmVzaXphYmxlYCBjbGFzcyBtZXRob2RzLCB0aGF0IGFyZVxuICAgKiByZXNwb25zaWJsZSBmb3IgZ3JpZHN0ZXIgcmVzaXplIHdoZW4gdGhlIGBkcmFnbW92ZWAgZXZlbnQgaXMgYmVpbmcgaGFuZGxlZC4gRS5nLiBpdCBtYXkgcmVmZXJlbmNlXG4gICAqIHRoZSBgaGFuZGxlTm9ydGhgIG1ldGhvZCB3aGVuIHRoZSBub3J0aCBoYW5kbGUgaXMgcHJlc3NlZCBhbmQgbW92ZWQgYnkgYSBtb3VzZS5cbiAgICovXG4gIHByaXZhdGUgZGlyZWN0aW9uRnVuY3Rpb246XG4gICAgfCAoKGV2ZW50OiBQaWNrPE1vdXNlRXZlbnQsICdjbGllbnRYJyB8ICdjbGllbnRZJz4pID0+IHZvaWQpXG4gICAgfCBudWxsID0gbnVsbDtcblxuICByZXNpemVFbmFibGVkOiBib29sZWFuO1xuICByZXNpemFibGVIYW5kbGVzOiB7XG4gICAgczogYm9vbGVhbjtcbiAgICBlOiBib29sZWFuO1xuICAgIG46IGJvb2xlYW47XG4gICAgdzogYm9vbGVhbjtcbiAgICBzZTogYm9vbGVhbjtcbiAgICBuZTogYm9vbGVhbjtcbiAgICBzdzogYm9vbGVhbjtcbiAgICBudzogYm9vbGVhbjtcbiAgfTtcbiAgbW91c2Vtb3ZlOiAoKSA9PiB2b2lkO1xuICBtb3VzZXVwOiAoKSA9PiB2b2lkO1xuICBtb3VzZWxlYXZlOiAoKSA9PiB2b2lkO1xuICBjYW5jZWxPbkJsdXI6ICgpID0+IHZvaWQ7XG4gIHRvdWNobW92ZTogKCkgPT4gdm9pZDtcbiAgdG91Y2hlbmQ6ICgpID0+IHZvaWQ7XG4gIHRvdWNoY2FuY2VsOiAoKSA9PiB2b2lkO1xuICBwdXNoOiBHcmlkc3RlclB1c2g7XG4gIHB1c2hSZXNpemU6IEdyaWRzdGVyUHVzaFJlc2l6ZTtcbiAgbWluSGVpZ2h0OiBudW1iZXI7XG4gIG1pbldpZHRoOiBudW1iZXI7XG4gIG9mZnNldFRvcDogbnVtYmVyO1xuICBvZmZzZXRMZWZ0OiBudW1iZXI7XG4gIGRpZmZUb3A6IG51bWJlcjtcbiAgZGlmZkxlZnQ6IG51bWJlcjtcbiAgZGlmZlJpZ2h0OiBudW1iZXI7XG4gIGRpZmZCb3R0b206IG51bWJlcjtcbiAgbWFyZ2luOiBudW1iZXI7XG4gIG9yaWdpbmFsQ2xpZW50WDogbnVtYmVyO1xuICBvcmlnaW5hbENsaWVudFk6IG51bWJlcjtcbiAgdG9wOiBudW1iZXI7XG4gIGxlZnQ6IG51bWJlcjtcbiAgYm90dG9tOiBudW1iZXI7XG4gIHJpZ2h0OiBudW1iZXI7XG4gIHdpZHRoOiBudW1iZXI7XG4gIGhlaWdodDogbnVtYmVyO1xuICBuZXdQb3NpdGlvbjogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGdyaWRzdGVySXRlbTogR3JpZHN0ZXJJdGVtQ29tcG9uZW50SW50ZXJmYWNlLFxuICAgIGdyaWRzdGVyOiBHcmlkc3RlckNvbXBvbmVudEludGVyZmFjZSxcbiAgICBwcml2YXRlIHpvbmU6IE5nWm9uZVxuICApIHtcbiAgICB0aGlzLmdyaWRzdGVySXRlbSA9IGdyaWRzdGVySXRlbTtcbiAgICB0aGlzLmdyaWRzdGVyID0gZ3JpZHN0ZXI7XG4gICAgdGhpcy5sYXN0TW91c2UgPSB7XG4gICAgICBjbGllbnRYOiAwLFxuICAgICAgY2xpZW50WTogMFxuICAgIH07XG4gICAgdGhpcy5pdGVtQmFja3VwID0gWzAsIDAsIDAsIDBdO1xuICAgIHRoaXMucmVzaXplRXZlbnRTY3JvbGxUeXBlID0ge1xuICAgICAgd2VzdDogZmFsc2UsXG4gICAgICBlYXN0OiBmYWxzZSxcbiAgICAgIG5vcnRoOiBmYWxzZSxcbiAgICAgIHNvdXRoOiBmYWxzZVxuICAgIH07XG4gIH1cblxuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuZ3JpZHN0ZXI/LnByZXZpZXdTdHlsZSgpO1xuICAgIHRoaXMuZ3JpZHN0ZXIgPSB0aGlzLmdyaWRzdGVySXRlbSA9IG51bGwhO1xuICB9XG5cbiAgZHJhZ1N0YXJ0KGU6IE1vdXNlRXZlbnQpOiB2b2lkIHtcbiAgICBpZiAoZS53aGljaCAmJiBlLndoaWNoICE9PSAxKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChcbiAgICAgIHRoaXMuZ3JpZHN0ZXIub3B0aW9ucy5yZXNpemFibGUgJiZcbiAgICAgIHRoaXMuZ3JpZHN0ZXIub3B0aW9ucy5yZXNpemFibGUuc3RhcnRcbiAgICApIHtcbiAgICAgIHRoaXMuZ3JpZHN0ZXIub3B0aW9ucy5yZXNpemFibGUuc3RhcnQoXG4gICAgICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLml0ZW0sXG4gICAgICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLFxuICAgICAgICBlXG4gICAgICApO1xuICAgIH1cbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgIHRoaXMuem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICB0aGlzLm1vdXNlbW92ZSA9IHRoaXMuZ3JpZHN0ZXJJdGVtLnJlbmRlcmVyLmxpc3RlbihcbiAgICAgICAgJ2RvY3VtZW50JyxcbiAgICAgICAgJ21vdXNlbW92ZScsXG4gICAgICAgIHRoaXMuZHJhZ01vdmVcbiAgICAgICk7XG4gICAgICB0aGlzLnRvdWNobW92ZSA9IHRoaXMuZ3JpZHN0ZXIucmVuZGVyZXIubGlzdGVuKFxuICAgICAgICB0aGlzLmdyaWRzdGVyLmVsLFxuICAgICAgICAndG91Y2htb3ZlJyxcbiAgICAgICAgdGhpcy5kcmFnTW92ZVxuICAgICAgKTtcbiAgICB9KTtcbiAgICB0aGlzLm1vdXNldXAgPSB0aGlzLmdyaWRzdGVySXRlbS5yZW5kZXJlci5saXN0ZW4oXG4gICAgICAnZG9jdW1lbnQnLFxuICAgICAgJ21vdXNldXAnLFxuICAgICAgdGhpcy5kcmFnU3RvcFxuICAgICk7XG4gICAgdGhpcy5tb3VzZWxlYXZlID0gdGhpcy5ncmlkc3Rlckl0ZW0ucmVuZGVyZXIubGlzdGVuKFxuICAgICAgJ2RvY3VtZW50JyxcbiAgICAgICdtb3VzZWxlYXZlJyxcbiAgICAgIHRoaXMuZHJhZ1N0b3BcbiAgICApO1xuICAgIHRoaXMuY2FuY2VsT25CbHVyID0gdGhpcy5ncmlkc3Rlckl0ZW0ucmVuZGVyZXIubGlzdGVuKFxuICAgICAgJ3dpbmRvdycsXG4gICAgICAnYmx1cicsXG4gICAgICB0aGlzLmRyYWdTdG9wXG4gICAgKTtcbiAgICB0aGlzLnRvdWNoZW5kID0gdGhpcy5ncmlkc3Rlckl0ZW0ucmVuZGVyZXIubGlzdGVuKFxuICAgICAgJ2RvY3VtZW50JyxcbiAgICAgICd0b3VjaGVuZCcsXG4gICAgICB0aGlzLmRyYWdTdG9wXG4gICAgKTtcbiAgICB0aGlzLnRvdWNoY2FuY2VsID0gdGhpcy5ncmlkc3Rlckl0ZW0ucmVuZGVyZXIubGlzdGVuKFxuICAgICAgJ2RvY3VtZW50JyxcbiAgICAgICd0b3VjaGNhbmNlbCcsXG4gICAgICB0aGlzLmRyYWdTdG9wXG4gICAgKTtcblxuICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLnJlbmRlcmVyLmFkZENsYXNzKFxuICAgICAgdGhpcy5ncmlkc3Rlckl0ZW0uZWwsXG4gICAgICAnZ3JpZHN0ZXItaXRlbS1yZXNpemluZydcbiAgICApO1xuICAgIHRoaXMubGFzdE1vdXNlLmNsaWVudFggPSBlLmNsaWVudFg7XG4gICAgdGhpcy5sYXN0TW91c2UuY2xpZW50WSA9IGUuY2xpZW50WTtcbiAgICB0aGlzLmxlZnQgPSB0aGlzLmdyaWRzdGVySXRlbS5sZWZ0O1xuICAgIHRoaXMudG9wID0gdGhpcy5ncmlkc3Rlckl0ZW0udG9wO1xuICAgIHRoaXMub3JpZ2luYWxDbGllbnRYID0gZS5jbGllbnRYO1xuICAgIHRoaXMub3JpZ2luYWxDbGllbnRZID0gZS5jbGllbnRZO1xuICAgIHRoaXMud2lkdGggPSB0aGlzLmdyaWRzdGVySXRlbS53aWR0aDtcbiAgICB0aGlzLmhlaWdodCA9IHRoaXMuZ3JpZHN0ZXJJdGVtLmhlaWdodDtcbiAgICB0aGlzLmJvdHRvbSA9IHRoaXMuZ3JpZHN0ZXJJdGVtLnRvcCArIHRoaXMuZ3JpZHN0ZXJJdGVtLmhlaWdodDtcbiAgICB0aGlzLnJpZ2h0ID0gdGhpcy5ncmlkc3Rlckl0ZW0ubGVmdCArIHRoaXMuZ3JpZHN0ZXJJdGVtLndpZHRoO1xuICAgIHRoaXMubWFyZ2luID0gdGhpcy5ncmlkc3Rlci4kb3B0aW9ucy5tYXJnaW47XG4gICAgdGhpcy5vZmZzZXRMZWZ0ID0gdGhpcy5ncmlkc3Rlci5lbC5zY3JvbGxMZWZ0IC0gdGhpcy5ncmlkc3Rlci5lbC5vZmZzZXRMZWZ0O1xuICAgIHRoaXMub2Zmc2V0VG9wID0gdGhpcy5ncmlkc3Rlci5lbC5zY3JvbGxUb3AgLSB0aGlzLmdyaWRzdGVyLmVsLm9mZnNldFRvcDtcbiAgICB0aGlzLmRpZmZMZWZ0ID0gZS5jbGllbnRYICsgdGhpcy5vZmZzZXRMZWZ0IC0gdGhpcy5sZWZ0O1xuICAgIHRoaXMuZGlmZlJpZ2h0ID0gZS5jbGllbnRYICsgdGhpcy5vZmZzZXRMZWZ0IC0gdGhpcy5yaWdodDtcbiAgICB0aGlzLmRpZmZUb3AgPSBlLmNsaWVudFkgKyB0aGlzLm9mZnNldFRvcCAtIHRoaXMudG9wO1xuICAgIHRoaXMuZGlmZkJvdHRvbSA9IGUuY2xpZW50WSArIHRoaXMub2Zmc2V0VG9wIC0gdGhpcy5ib3R0b207XG4gICAgdGhpcy5taW5IZWlnaHQgPVxuICAgICAgdGhpcy5ncmlkc3Rlci5wb3NpdGlvbllUb1BpeGVscyhcbiAgICAgICAgdGhpcy5ncmlkc3Rlckl0ZW0uJGl0ZW0ubWluSXRlbVJvd3MgfHxcbiAgICAgICAgICB0aGlzLmdyaWRzdGVyLiRvcHRpb25zLm1pbkl0ZW1Sb3dzXG4gICAgICApIC0gdGhpcy5tYXJnaW47XG4gICAgdGhpcy5taW5XaWR0aCA9XG4gICAgICB0aGlzLmdyaWRzdGVyLnBvc2l0aW9uWFRvUGl4ZWxzKFxuICAgICAgICB0aGlzLmdyaWRzdGVySXRlbS4kaXRlbS5taW5JdGVtQ29scyB8fFxuICAgICAgICAgIHRoaXMuZ3JpZHN0ZXIuJG9wdGlvbnMubWluSXRlbUNvbHNcbiAgICAgICkgLSB0aGlzLm1hcmdpbjtcbiAgICB0aGlzLmdyaWRzdGVyLm1vdmluZ0l0ZW0gPSB0aGlzLmdyaWRzdGVySXRlbS4kaXRlbTtcbiAgICB0aGlzLmdyaWRzdGVyLnByZXZpZXdTdHlsZSgpO1xuICAgIHRoaXMucHVzaCA9IG5ldyBHcmlkc3RlclB1c2godGhpcy5ncmlkc3Rlckl0ZW0pO1xuICAgIHRoaXMucHVzaFJlc2l6ZSA9IG5ldyBHcmlkc3RlclB1c2hSZXNpemUodGhpcy5ncmlkc3Rlckl0ZW0pO1xuICAgIHRoaXMuZ3JpZHN0ZXIuZHJhZ0luUHJvZ3Jlc3MgPSB0cnVlO1xuICAgIHRoaXMuZ3JpZHN0ZXIudXBkYXRlR3JpZCgpO1xuXG4gICAgY29uc3QgeyBjbGFzc0xpc3QgfSA9IGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50O1xuXG4gICAgaWYgKGNsYXNzTGlzdC5jb250YWlucygnaGFuZGxlLW4nKSkge1xuICAgICAgdGhpcy5yZXNpemVFdmVudFNjcm9sbFR5cGUubm9ydGggPSB0cnVlO1xuICAgICAgdGhpcy5kaXJlY3Rpb25GdW5jdGlvbiA9IHRoaXMuaGFuZGxlTm9ydGg7XG4gICAgfSBlbHNlIGlmIChjbGFzc0xpc3QuY29udGFpbnMoJ2hhbmRsZS13JykpIHtcbiAgICAgIGlmICh0aGlzLmdyaWRzdGVyLiRvcHRpb25zLmRpclR5cGUgPT09IERpclR5cGVzLlJUTCkge1xuICAgICAgICB0aGlzLnJlc2l6ZUV2ZW50U2Nyb2xsVHlwZS5lYXN0ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5kaXJlY3Rpb25GdW5jdGlvbiA9IHRoaXMuaGFuZGxlRWFzdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucmVzaXplRXZlbnRTY3JvbGxUeXBlLndlc3QgPSB0cnVlO1xuICAgICAgICB0aGlzLmRpcmVjdGlvbkZ1bmN0aW9uID0gdGhpcy5oYW5kbGVXZXN0O1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY2xhc3NMaXN0LmNvbnRhaW5zKCdoYW5kbGUtcycpKSB7XG4gICAgICB0aGlzLnJlc2l6ZUV2ZW50U2Nyb2xsVHlwZS5zb3V0aCA9IHRydWU7XG4gICAgICB0aGlzLmRpcmVjdGlvbkZ1bmN0aW9uID0gdGhpcy5oYW5kbGVTb3V0aDtcbiAgICB9IGVsc2UgaWYgKGNsYXNzTGlzdC5jb250YWlucygnaGFuZGxlLWUnKSkge1xuICAgICAgaWYgKHRoaXMuZ3JpZHN0ZXIuJG9wdGlvbnMuZGlyVHlwZSA9PT0gRGlyVHlwZXMuUlRMKSB7XG4gICAgICAgIHRoaXMucmVzaXplRXZlbnRTY3JvbGxUeXBlLndlc3QgPSB0cnVlO1xuICAgICAgICB0aGlzLmRpcmVjdGlvbkZ1bmN0aW9uID0gdGhpcy5oYW5kbGVXZXN0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZXNpemVFdmVudFNjcm9sbFR5cGUuZWFzdCA9IHRydWU7XG4gICAgICAgIHRoaXMuZGlyZWN0aW9uRnVuY3Rpb24gPSB0aGlzLmhhbmRsZUVhc3Q7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjbGFzc0xpc3QuY29udGFpbnMoJ2hhbmRsZS1udycpKSB7XG4gICAgICBpZiAodGhpcy5ncmlkc3Rlci4kb3B0aW9ucy5kaXJUeXBlID09PSBEaXJUeXBlcy5SVEwpIHtcbiAgICAgICAgdGhpcy5yZXNpemVFdmVudFNjcm9sbFR5cGUubm9ydGggPSB0cnVlO1xuICAgICAgICB0aGlzLnJlc2l6ZUV2ZW50U2Nyb2xsVHlwZS5lYXN0ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5kaXJlY3Rpb25GdW5jdGlvbiA9IHRoaXMuaGFuZGxlTm9ydGhFYXN0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZXNpemVFdmVudFNjcm9sbFR5cGUubm9ydGggPSB0cnVlO1xuICAgICAgICB0aGlzLnJlc2l6ZUV2ZW50U2Nyb2xsVHlwZS53ZXN0ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5kaXJlY3Rpb25GdW5jdGlvbiA9IHRoaXMuaGFuZGxlTm9ydGhXZXN0O1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY2xhc3NMaXN0LmNvbnRhaW5zKCdoYW5kbGUtbmUnKSkge1xuICAgICAgaWYgKHRoaXMuZ3JpZHN0ZXIuJG9wdGlvbnMuZGlyVHlwZSA9PT0gRGlyVHlwZXMuUlRMKSB7XG4gICAgICAgIHRoaXMucmVzaXplRXZlbnRTY3JvbGxUeXBlLm5vcnRoID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5yZXNpemVFdmVudFNjcm9sbFR5cGUud2VzdCA9IHRydWU7XG4gICAgICAgIHRoaXMuZGlyZWN0aW9uRnVuY3Rpb24gPSB0aGlzLmhhbmRsZU5vcnRoV2VzdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucmVzaXplRXZlbnRTY3JvbGxUeXBlLm5vcnRoID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5yZXNpemVFdmVudFNjcm9sbFR5cGUuZWFzdCA9IHRydWU7XG4gICAgICAgIHRoaXMuZGlyZWN0aW9uRnVuY3Rpb24gPSB0aGlzLmhhbmRsZU5vcnRoRWFzdDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGNsYXNzTGlzdC5jb250YWlucygnaGFuZGxlLXN3JykpIHtcbiAgICAgIGlmICh0aGlzLmdyaWRzdGVyLiRvcHRpb25zLmRpclR5cGUgPT09IERpclR5cGVzLlJUTCkge1xuICAgICAgICB0aGlzLnJlc2l6ZUV2ZW50U2Nyb2xsVHlwZS5zb3V0aCA9IHRydWU7XG4gICAgICAgIHRoaXMucmVzaXplRXZlbnRTY3JvbGxUeXBlLmVhc3QgPSB0cnVlO1xuICAgICAgICB0aGlzLmRpcmVjdGlvbkZ1bmN0aW9uID0gdGhpcy5oYW5kbGVTb3V0aEVhc3Q7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJlc2l6ZUV2ZW50U2Nyb2xsVHlwZS5zb3V0aCA9IHRydWU7XG4gICAgICAgIHRoaXMucmVzaXplRXZlbnRTY3JvbGxUeXBlLndlc3QgPSB0cnVlO1xuICAgICAgICB0aGlzLmRpcmVjdGlvbkZ1bmN0aW9uID0gdGhpcy5oYW5kbGVTb3V0aFdlc3Q7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjbGFzc0xpc3QuY29udGFpbnMoJ2hhbmRsZS1zZScpKSB7XG4gICAgICBpZiAodGhpcy5ncmlkc3Rlci4kb3B0aW9ucy5kaXJUeXBlID09PSBEaXJUeXBlcy5SVEwpIHtcbiAgICAgICAgdGhpcy5yZXNpemVFdmVudFNjcm9sbFR5cGUuc291dGggPSB0cnVlO1xuICAgICAgICB0aGlzLnJlc2l6ZUV2ZW50U2Nyb2xsVHlwZS53ZXN0ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5kaXJlY3Rpb25GdW5jdGlvbiA9IHRoaXMuaGFuZGxlU291dGhXZXN0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZXNpemVFdmVudFNjcm9sbFR5cGUuc291dGggPSB0cnVlO1xuICAgICAgICB0aGlzLnJlc2l6ZUV2ZW50U2Nyb2xsVHlwZS5lYXN0ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5kaXJlY3Rpb25GdW5jdGlvbiA9IHRoaXMuaGFuZGxlU291dGhFYXN0O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGRyYWdNb3ZlID0gKGU6IE1vdXNlRXZlbnQpOiB2b2lkID0+IHtcbiAgICBpZiAodGhpcy5kaXJlY3Rpb25GdW5jdGlvbiA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnVGhlIGBkaXJlY3Rpb25GdW5jdGlvbmAgaGFzIG5vdCBiZWVuIHNldCBiZWZvcmUgY2FsbGluZyBgZHJhZ01vdmVgLidcbiAgICAgICk7XG4gICAgfVxuXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgR3JpZHN0ZXJVdGlscy5jaGVja1RvdWNoRXZlbnQoZSk7XG4gICAgdGhpcy5vZmZzZXRUb3AgPSB0aGlzLmdyaWRzdGVyLmVsLnNjcm9sbFRvcCAtIHRoaXMuZ3JpZHN0ZXIuZWwub2Zmc2V0VG9wO1xuICAgIHRoaXMub2Zmc2V0TGVmdCA9IHRoaXMuZ3JpZHN0ZXIuZWwuc2Nyb2xsTGVmdCAtIHRoaXMuZ3JpZHN0ZXIuZWwub2Zmc2V0TGVmdDtcbiAgICBzY3JvbGwoXG4gICAgICB0aGlzLmdyaWRzdGVyLFxuICAgICAgdGhpcy5sZWZ0LFxuICAgICAgdGhpcy50b3AsXG4gICAgICB0aGlzLndpZHRoLFxuICAgICAgdGhpcy5oZWlnaHQsXG4gICAgICBlLFxuICAgICAgdGhpcy5sYXN0TW91c2UsXG4gICAgICB0aGlzLmRpcmVjdGlvbkZ1bmN0aW9uLFxuICAgICAgdHJ1ZSxcbiAgICAgIHRoaXMucmVzaXplRXZlbnRTY3JvbGxUeXBlXG4gICAgKTtcblxuICAgIGNvbnN0IHNjYWxlID0gdGhpcy5ncmlkc3Rlci5vcHRpb25zLnNjYWxlIHx8IDE7XG4gICAgdGhpcy5kaXJlY3Rpb25GdW5jdGlvbih7XG4gICAgICBjbGllbnRYOlxuICAgICAgICB0aGlzLm9yaWdpbmFsQ2xpZW50WCArIChlLmNsaWVudFggLSB0aGlzLm9yaWdpbmFsQ2xpZW50WCkgLyBzY2FsZSxcbiAgICAgIGNsaWVudFk6IHRoaXMub3JpZ2luYWxDbGllbnRZICsgKGUuY2xpZW50WSAtIHRoaXMub3JpZ2luYWxDbGllbnRZKSAvIHNjYWxlXG4gICAgfSk7XG5cbiAgICB0aGlzLmxhc3RNb3VzZS5jbGllbnRYID0gZS5jbGllbnRYO1xuICAgIHRoaXMubGFzdE1vdXNlLmNsaWVudFkgPSBlLmNsaWVudFk7XG4gICAgdGhpcy56b25lLnJ1bigoKSA9PiB7XG4gICAgICB0aGlzLmdyaWRzdGVyLnVwZGF0ZUdyaWQoKTtcbiAgICB9KTtcbiAgfTtcblxuICBkcmFnU3RvcCA9IChlOiBNb3VzZUV2ZW50KTogdm9pZCA9PiB7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgY2FuY2VsU2Nyb2xsKCk7XG4gICAgdGhpcy5tb3VzZW1vdmUoKTtcbiAgICB0aGlzLm1vdXNldXAoKTtcbiAgICB0aGlzLm1vdXNlbGVhdmUoKTtcbiAgICB0aGlzLmNhbmNlbE9uQmx1cigpO1xuICAgIHRoaXMudG91Y2htb3ZlKCk7XG4gICAgdGhpcy50b3VjaGVuZCgpO1xuICAgIHRoaXMudG91Y2hjYW5jZWwoKTtcbiAgICB0aGlzLmdyaWRzdGVyLmRyYWdJblByb2dyZXNzID0gZmFsc2U7XG4gICAgdGhpcy5ncmlkc3Rlci51cGRhdGVHcmlkKCk7XG4gICAgaWYgKFxuICAgICAgdGhpcy5ncmlkc3Rlci5vcHRpb25zLnJlc2l6YWJsZSAmJlxuICAgICAgdGhpcy5ncmlkc3Rlci5vcHRpb25zLnJlc2l6YWJsZS5zdG9wXG4gICAgKSB7XG4gICAgICBQcm9taXNlLnJlc29sdmUoXG4gICAgICAgIHRoaXMuZ3JpZHN0ZXIub3B0aW9ucy5yZXNpemFibGUuc3RvcChcbiAgICAgICAgICB0aGlzLmdyaWRzdGVySXRlbS5pdGVtLFxuICAgICAgICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLFxuICAgICAgICAgIGVcbiAgICAgICAgKVxuICAgICAgKS50aGVuKHRoaXMubWFrZVJlc2l6ZSwgdGhpcy5jYW5jZWxSZXNpemUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm1ha2VSZXNpemUoKTtcbiAgICB9XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLmdyaWRzdGVySXRlbS5yZW5kZXJlci5yZW1vdmVDbGFzcyhcbiAgICAgICAgdGhpcy5ncmlkc3Rlckl0ZW0uZWwsXG4gICAgICAgICdncmlkc3Rlci1pdGVtLXJlc2l6aW5nJ1xuICAgICAgKTtcbiAgICAgIGlmICh0aGlzLmdyaWRzdGVyKSB7XG4gICAgICAgIHRoaXMuZ3JpZHN0ZXIubW92aW5nSXRlbSA9IG51bGw7XG4gICAgICAgIHRoaXMuZ3JpZHN0ZXIucHJldmlld1N0eWxlKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgY2FuY2VsUmVzaXplID0gKCk6IHZvaWQgPT4ge1xuICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLmNvbHMgPSB0aGlzLmdyaWRzdGVySXRlbS5pdGVtLmNvbHMgfHwgMTtcbiAgICB0aGlzLmdyaWRzdGVySXRlbS4kaXRlbS5yb3dzID0gdGhpcy5ncmlkc3Rlckl0ZW0uaXRlbS5yb3dzIHx8IDE7XG4gICAgdGhpcy5ncmlkc3Rlckl0ZW0uJGl0ZW0ueCA9IHRoaXMuZ3JpZHN0ZXJJdGVtLml0ZW0ueCB8fCAwO1xuICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLnkgPSB0aGlzLmdyaWRzdGVySXRlbS5pdGVtLnkgfHwgMDtcbiAgICB0aGlzLmdyaWRzdGVySXRlbS5zZXRTaXplKCk7XG4gICAgdGhpcy5wdXNoLnJlc3RvcmVJdGVtcygpO1xuICAgIHRoaXMucHVzaFJlc2l6ZS5yZXN0b3JlSXRlbXMoKTtcbiAgICB0aGlzLnB1c2guZGVzdHJveSgpO1xuICAgIHRoaXMucHVzaCA9IG51bGwhO1xuICAgIHRoaXMucHVzaFJlc2l6ZS5kZXN0cm95KCk7XG4gICAgdGhpcy5wdXNoUmVzaXplID0gbnVsbCE7XG4gIH07XG5cbiAgbWFrZVJlc2l6ZSA9ICgpOiB2b2lkID0+IHtcbiAgICB0aGlzLmdyaWRzdGVySXRlbS5zZXRTaXplKCk7XG4gICAgdGhpcy5ncmlkc3Rlckl0ZW0uY2hlY2tJdGVtQ2hhbmdlcyhcbiAgICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLFxuICAgICAgdGhpcy5ncmlkc3Rlckl0ZW0uaXRlbVxuICAgICk7XG4gICAgdGhpcy5wdXNoLnNldFB1c2hlZEl0ZW1zKCk7XG4gICAgdGhpcy5wdXNoUmVzaXplLnNldFB1c2hlZEl0ZW1zKCk7XG4gICAgdGhpcy5wdXNoLmRlc3Ryb3koKTtcbiAgICB0aGlzLnB1c2ggPSBudWxsITtcbiAgICB0aGlzLnB1c2hSZXNpemUuZGVzdHJveSgpO1xuICAgIHRoaXMucHVzaFJlc2l6ZSA9IG51bGwhO1xuICB9O1xuXG4gIHByaXZhdGUgaGFuZGxlTm9ydGggPSAoZTogTW91c2VFdmVudCk6IHZvaWQgPT4ge1xuICAgIHRoaXMudG9wID0gZS5jbGllbnRZICsgdGhpcy5vZmZzZXRUb3AgLSB0aGlzLmRpZmZUb3A7XG4gICAgdGhpcy5oZWlnaHQgPSB0aGlzLmJvdHRvbSAtIHRoaXMudG9wO1xuICAgIGlmICh0aGlzLm1pbkhlaWdodCA+IHRoaXMuaGVpZ2h0KSB7XG4gICAgICB0aGlzLmhlaWdodCA9IHRoaXMubWluSGVpZ2h0O1xuICAgICAgdGhpcy50b3AgPSB0aGlzLmJvdHRvbSAtIHRoaXMubWluSGVpZ2h0O1xuICAgIH1cbiAgICB0aGlzLm5ld1Bvc2l0aW9uID0gdGhpcy5ncmlkc3Rlci5waXhlbHNUb1Bvc2l0aW9uWShcbiAgICAgIHRoaXMudG9wICsgdGhpcy5tYXJnaW4sXG4gICAgICBNYXRoLmZsb29yXG4gICAgKTtcbiAgICBpZiAodGhpcy5ncmlkc3Rlckl0ZW0uJGl0ZW0ueSAhPT0gdGhpcy5uZXdQb3NpdGlvbikge1xuICAgICAgdGhpcy5pdGVtQmFja3VwWzFdID0gdGhpcy5ncmlkc3Rlckl0ZW0uJGl0ZW0ueTtcbiAgICAgIHRoaXMuaXRlbUJhY2t1cFszXSA9IHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLnJvd3M7XG4gICAgICB0aGlzLmdyaWRzdGVySXRlbS4kaXRlbS5yb3dzICs9XG4gICAgICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLnkgLSB0aGlzLm5ld1Bvc2l0aW9uO1xuICAgICAgdGhpcy5ncmlkc3Rlckl0ZW0uJGl0ZW0ueSA9IHRoaXMubmV3UG9zaXRpb247XG4gICAgICB0aGlzLnB1c2hSZXNpemUucHVzaEl0ZW1zKHRoaXMucHVzaFJlc2l6ZS5mcm9tU291dGgpO1xuICAgICAgdGhpcy5wdXNoLnB1c2hJdGVtcyhcbiAgICAgICAgdGhpcy5wdXNoLmZyb21Tb3V0aCxcbiAgICAgICAgdGhpcy5ncmlkc3Rlci4kb3B0aW9ucy5kaXNhYmxlUHVzaE9uUmVzaXplXG4gICAgICApO1xuICAgICAgaWYgKHRoaXMuZ3JpZHN0ZXIuY2hlY2tDb2xsaXNpb24odGhpcy5ncmlkc3Rlckl0ZW0uJGl0ZW0pKSB7XG4gICAgICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLnkgPSB0aGlzLml0ZW1CYWNrdXBbMV07XG4gICAgICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLnJvd3MgPSB0aGlzLml0ZW1CYWNrdXBbM107XG4gICAgICAgIHRoaXMuc2V0SXRlbVRvcChcbiAgICAgICAgICB0aGlzLmdyaWRzdGVyLnBvc2l0aW9uWVRvUGl4ZWxzKHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLnkpXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuc2V0SXRlbUhlaWdodChcbiAgICAgICAgICB0aGlzLmdyaWRzdGVyLnBvc2l0aW9uWVRvUGl4ZWxzKHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLnJvd3MpIC1cbiAgICAgICAgICAgIHRoaXMubWFyZ2luXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZ3JpZHN0ZXIucHJldmlld1N0eWxlKCk7XG4gICAgICB9XG4gICAgICB0aGlzLnB1c2hSZXNpemUuY2hlY2tQdXNoQmFjaygpO1xuICAgICAgdGhpcy5wdXNoLmNoZWNrUHVzaEJhY2soKTtcbiAgICB9XG4gICAgdGhpcy5zZXRJdGVtVG9wKHRoaXMudG9wKTtcbiAgICB0aGlzLnNldEl0ZW1IZWlnaHQodGhpcy5oZWlnaHQpO1xuICB9O1xuXG4gIHByaXZhdGUgaGFuZGxlV2VzdCA9IChlOiBNb3VzZUV2ZW50KTogdm9pZCA9PiB7XG4gICAgY29uc3QgY2xpZW50WCA9XG4gICAgICB0aGlzLmdyaWRzdGVyLiRvcHRpb25zLmRpclR5cGUgPT09IERpclR5cGVzLlJUTFxuICAgICAgICA/IHRoaXMub3JpZ2luYWxDbGllbnRYICsgKHRoaXMub3JpZ2luYWxDbGllbnRYIC0gZS5jbGllbnRYKVxuICAgICAgICA6IGUuY2xpZW50WDtcbiAgICB0aGlzLmxlZnQgPSBjbGllbnRYICsgdGhpcy5vZmZzZXRMZWZ0IC0gdGhpcy5kaWZmTGVmdDtcblxuICAgIHRoaXMud2lkdGggPSB0aGlzLnJpZ2h0IC0gdGhpcy5sZWZ0O1xuICAgIGlmICh0aGlzLm1pbldpZHRoID4gdGhpcy53aWR0aCkge1xuICAgICAgdGhpcy53aWR0aCA9IHRoaXMubWluV2lkdGg7XG4gICAgICB0aGlzLmxlZnQgPSB0aGlzLnJpZ2h0IC0gdGhpcy5taW5XaWR0aDtcbiAgICB9XG4gICAgdGhpcy5uZXdQb3NpdGlvbiA9IHRoaXMuZ3JpZHN0ZXIucGl4ZWxzVG9Qb3NpdGlvblgoXG4gICAgICB0aGlzLmxlZnQgKyB0aGlzLm1hcmdpbixcbiAgICAgIE1hdGguZmxvb3JcbiAgICApO1xuICAgIGlmICh0aGlzLmdyaWRzdGVySXRlbS4kaXRlbS54ICE9PSB0aGlzLm5ld1Bvc2l0aW9uKSB7XG4gICAgICB0aGlzLml0ZW1CYWNrdXBbMF0gPSB0aGlzLmdyaWRzdGVySXRlbS4kaXRlbS54O1xuICAgICAgdGhpcy5pdGVtQmFja3VwWzJdID0gdGhpcy5ncmlkc3Rlckl0ZW0uJGl0ZW0uY29scztcbiAgICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLmNvbHMgKz1cbiAgICAgICAgdGhpcy5ncmlkc3Rlckl0ZW0uJGl0ZW0ueCAtIHRoaXMubmV3UG9zaXRpb247XG4gICAgICB0aGlzLmdyaWRzdGVySXRlbS4kaXRlbS54ID0gdGhpcy5uZXdQb3NpdGlvbjtcbiAgICAgIHRoaXMucHVzaFJlc2l6ZS5wdXNoSXRlbXModGhpcy5wdXNoUmVzaXplLmZyb21FYXN0KTtcbiAgICAgIHRoaXMucHVzaC5wdXNoSXRlbXMoXG4gICAgICAgIHRoaXMucHVzaC5mcm9tRWFzdCxcbiAgICAgICAgdGhpcy5ncmlkc3Rlci4kb3B0aW9ucy5kaXNhYmxlUHVzaE9uUmVzaXplXG4gICAgICApO1xuICAgICAgaWYgKHRoaXMuZ3JpZHN0ZXIuY2hlY2tDb2xsaXNpb24odGhpcy5ncmlkc3Rlckl0ZW0uJGl0ZW0pKSB7XG4gICAgICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLnggPSB0aGlzLml0ZW1CYWNrdXBbMF07XG4gICAgICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLmNvbHMgPSB0aGlzLml0ZW1CYWNrdXBbMl07XG4gICAgICAgIHRoaXMuc2V0SXRlbUxlZnQoXG4gICAgICAgICAgdGhpcy5ncmlkc3Rlci5wb3NpdGlvblhUb1BpeGVscyh0aGlzLmdyaWRzdGVySXRlbS4kaXRlbS54KVxuICAgICAgICApO1xuICAgICAgICB0aGlzLnNldEl0ZW1XaWR0aChcbiAgICAgICAgICB0aGlzLmdyaWRzdGVyLnBvc2l0aW9uWFRvUGl4ZWxzKHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLmNvbHMpIC1cbiAgICAgICAgICAgIHRoaXMubWFyZ2luXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZ3JpZHN0ZXIucHJldmlld1N0eWxlKCk7XG4gICAgICB9XG4gICAgICB0aGlzLnB1c2hSZXNpemUuY2hlY2tQdXNoQmFjaygpO1xuICAgICAgdGhpcy5wdXNoLmNoZWNrUHVzaEJhY2soKTtcbiAgICB9XG4gICAgdGhpcy5zZXRJdGVtTGVmdCh0aGlzLmxlZnQpO1xuICAgIHRoaXMuc2V0SXRlbVdpZHRoKHRoaXMud2lkdGgpO1xuICB9O1xuXG4gIHByaXZhdGUgaGFuZGxlU291dGggPSAoZTogTW91c2VFdmVudCk6IHZvaWQgPT4ge1xuICAgIHRoaXMuaGVpZ2h0ID0gZS5jbGllbnRZICsgdGhpcy5vZmZzZXRUb3AgLSB0aGlzLmRpZmZCb3R0b20gLSB0aGlzLnRvcDtcbiAgICBpZiAodGhpcy5taW5IZWlnaHQgPiB0aGlzLmhlaWdodCkge1xuICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLm1pbkhlaWdodDtcbiAgICB9XG4gICAgdGhpcy5ib3R0b20gPSB0aGlzLnRvcCArIHRoaXMuaGVpZ2h0O1xuICAgIHRoaXMubmV3UG9zaXRpb24gPSB0aGlzLmdyaWRzdGVyLnBpeGVsc1RvUG9zaXRpb25ZKHRoaXMuYm90dG9tLCBNYXRoLmNlaWwpO1xuICAgIGlmIChcbiAgICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLnkgKyB0aGlzLmdyaWRzdGVySXRlbS4kaXRlbS5yb3dzICE9PVxuICAgICAgdGhpcy5uZXdQb3NpdGlvblxuICAgICkge1xuICAgICAgdGhpcy5pdGVtQmFja3VwWzNdID0gdGhpcy5ncmlkc3Rlckl0ZW0uJGl0ZW0ucm93cztcbiAgICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLnJvd3MgPVxuICAgICAgICB0aGlzLm5ld1Bvc2l0aW9uIC0gdGhpcy5ncmlkc3Rlckl0ZW0uJGl0ZW0ueTtcbiAgICAgIHRoaXMucHVzaFJlc2l6ZS5wdXNoSXRlbXModGhpcy5wdXNoUmVzaXplLmZyb21Ob3J0aCk7XG4gICAgICB0aGlzLnB1c2gucHVzaEl0ZW1zKFxuICAgICAgICB0aGlzLnB1c2guZnJvbU5vcnRoLFxuICAgICAgICB0aGlzLmdyaWRzdGVyLiRvcHRpb25zLmRpc2FibGVQdXNoT25SZXNpemVcbiAgICAgICk7XG4gICAgICBpZiAodGhpcy5ncmlkc3Rlci5jaGVja0NvbGxpc2lvbih0aGlzLmdyaWRzdGVySXRlbS4kaXRlbSkpIHtcbiAgICAgICAgdGhpcy5ncmlkc3Rlckl0ZW0uJGl0ZW0ucm93cyA9IHRoaXMuaXRlbUJhY2t1cFszXTtcbiAgICAgICAgdGhpcy5zZXRJdGVtSGVpZ2h0KFxuICAgICAgICAgIHRoaXMuZ3JpZHN0ZXIucG9zaXRpb25ZVG9QaXhlbHModGhpcy5ncmlkc3Rlckl0ZW0uJGl0ZW0ucm93cykgLVxuICAgICAgICAgICAgdGhpcy5tYXJnaW5cbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5ncmlkc3Rlci5wcmV2aWV3U3R5bGUoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucHVzaFJlc2l6ZS5jaGVja1B1c2hCYWNrKCk7XG4gICAgICB0aGlzLnB1c2guY2hlY2tQdXNoQmFjaygpO1xuICAgIH1cbiAgICB0aGlzLnNldEl0ZW1IZWlnaHQodGhpcy5oZWlnaHQpO1xuICB9O1xuXG4gIHByaXZhdGUgaGFuZGxlRWFzdCA9IChlOiBNb3VzZUV2ZW50KTogdm9pZCA9PiB7XG4gICAgY29uc3QgY2xpZW50WCA9XG4gICAgICB0aGlzLmdyaWRzdGVyLiRvcHRpb25zLmRpclR5cGUgPT09IERpclR5cGVzLlJUTFxuICAgICAgICA/IHRoaXMub3JpZ2luYWxDbGllbnRYICsgKHRoaXMub3JpZ2luYWxDbGllbnRYIC0gZS5jbGllbnRYKVxuICAgICAgICA6IGUuY2xpZW50WDtcbiAgICB0aGlzLndpZHRoID0gY2xpZW50WCArIHRoaXMub2Zmc2V0TGVmdCAtIHRoaXMuZGlmZlJpZ2h0IC0gdGhpcy5sZWZ0O1xuXG4gICAgaWYgKHRoaXMubWluV2lkdGggPiB0aGlzLndpZHRoKSB7XG4gICAgICB0aGlzLndpZHRoID0gdGhpcy5taW5XaWR0aDtcbiAgICB9XG4gICAgdGhpcy5yaWdodCA9IHRoaXMubGVmdCArIHRoaXMud2lkdGg7XG4gICAgdGhpcy5uZXdQb3NpdGlvbiA9IHRoaXMuZ3JpZHN0ZXIucGl4ZWxzVG9Qb3NpdGlvblgodGhpcy5yaWdodCwgTWF0aC5jZWlsKTtcbiAgICBpZiAoXG4gICAgICB0aGlzLmdyaWRzdGVySXRlbS4kaXRlbS54ICsgdGhpcy5ncmlkc3Rlckl0ZW0uJGl0ZW0uY29scyAhPT1cbiAgICAgIHRoaXMubmV3UG9zaXRpb25cbiAgICApIHtcbiAgICAgIHRoaXMuaXRlbUJhY2t1cFsyXSA9IHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLmNvbHM7XG4gICAgICB0aGlzLmdyaWRzdGVySXRlbS4kaXRlbS5jb2xzID1cbiAgICAgICAgdGhpcy5uZXdQb3NpdGlvbiAtIHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLng7XG4gICAgICB0aGlzLnB1c2hSZXNpemUucHVzaEl0ZW1zKHRoaXMucHVzaFJlc2l6ZS5mcm9tV2VzdCk7XG4gICAgICB0aGlzLnB1c2gucHVzaEl0ZW1zKFxuICAgICAgICB0aGlzLnB1c2guZnJvbVdlc3QsXG4gICAgICAgIHRoaXMuZ3JpZHN0ZXIuJG9wdGlvbnMuZGlzYWJsZVB1c2hPblJlc2l6ZVxuICAgICAgKTtcbiAgICAgIGlmICh0aGlzLmdyaWRzdGVyLmNoZWNrQ29sbGlzaW9uKHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtKSkge1xuICAgICAgICB0aGlzLmdyaWRzdGVySXRlbS4kaXRlbS5jb2xzID0gdGhpcy5pdGVtQmFja3VwWzJdO1xuICAgICAgICB0aGlzLnNldEl0ZW1XaWR0aChcbiAgICAgICAgICB0aGlzLmdyaWRzdGVyLnBvc2l0aW9uWFRvUGl4ZWxzKHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLmNvbHMpIC1cbiAgICAgICAgICAgIHRoaXMubWFyZ2luXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZ3JpZHN0ZXIucHJldmlld1N0eWxlKCk7XG4gICAgICB9XG4gICAgICB0aGlzLnB1c2hSZXNpemUuY2hlY2tQdXNoQmFjaygpO1xuICAgICAgdGhpcy5wdXNoLmNoZWNrUHVzaEJhY2soKTtcbiAgICB9XG4gICAgdGhpcy5zZXRJdGVtV2lkdGgodGhpcy53aWR0aCk7XG4gIH07XG5cbiAgcHJpdmF0ZSBoYW5kbGVOb3J0aFdlc3QgPSAoZTogTW91c2VFdmVudCk6IHZvaWQgPT4ge1xuICAgIHRoaXMuaGFuZGxlTm9ydGgoZSk7XG4gICAgdGhpcy5oYW5kbGVXZXN0KGUpO1xuICB9O1xuXG4gIHByaXZhdGUgaGFuZGxlTm9ydGhFYXN0ID0gKGU6IE1vdXNlRXZlbnQpOiB2b2lkID0+IHtcbiAgICB0aGlzLmhhbmRsZU5vcnRoKGUpO1xuICAgIHRoaXMuaGFuZGxlRWFzdChlKTtcbiAgfTtcblxuICBwcml2YXRlIGhhbmRsZVNvdXRoV2VzdCA9IChlOiBNb3VzZUV2ZW50KTogdm9pZCA9PiB7XG4gICAgdGhpcy5oYW5kbGVTb3V0aChlKTtcbiAgICB0aGlzLmhhbmRsZVdlc3QoZSk7XG4gIH07XG5cbiAgcHJpdmF0ZSBoYW5kbGVTb3V0aEVhc3QgPSAoZTogTW91c2VFdmVudCk6IHZvaWQgPT4ge1xuICAgIHRoaXMuaGFuZGxlU291dGgoZSk7XG4gICAgdGhpcy5oYW5kbGVFYXN0KGUpO1xuICB9O1xuXG4gIHRvZ2dsZSgpOiB2b2lkIHtcbiAgICB0aGlzLnJlc2l6ZUVuYWJsZWQgPSB0aGlzLmdyaWRzdGVySXRlbS5jYW5CZVJlc2l6ZWQoKTtcbiAgICB0aGlzLnJlc2l6YWJsZUhhbmRsZXMgPSB0aGlzLmdyaWRzdGVySXRlbS5nZXRSZXNpemFibGVIYW5kbGVzKCk7XG4gIH1cblxuICBkcmFnU3RhcnREZWxheShlOiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCk6IHZvaWQge1xuICAgIEdyaWRzdGVyVXRpbHMuY2hlY2tUb3VjaEV2ZW50KGUpO1xuXG4gICAgaWYgKCF0aGlzLmdyaWRzdGVyLiRvcHRpb25zLnJlc2l6YWJsZS5kZWxheVN0YXJ0KSB7XG4gICAgICB0aGlzLmRyYWdTdGFydChlIGFzIE1vdXNlRXZlbnQpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuZHJhZ1N0YXJ0KGUgYXMgTW91c2VFdmVudCk7XG4gICAgICBjYW5jZWxEcmFnKCk7XG4gICAgfSwgdGhpcy5ncmlkc3Rlci4kb3B0aW9ucy5yZXNpemFibGUuZGVsYXlTdGFydCk7XG5cbiAgICBjb25zdCB7XG4gICAgICBjYW5jZWxNb3VzZSxcbiAgICAgIGNhbmNlbE1vdXNlTGVhdmUsXG4gICAgICBjYW5jZWxPbkJsdXIsXG4gICAgICBjYW5jZWxUb3VjaE1vdmUsXG4gICAgICBjYW5jZWxUb3VjaEVuZCxcbiAgICAgIGNhbmNlbFRvdWNoQ2FuY2VsXG4gICAgfSA9IHRoaXMuem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAvLyBOb3RlOiBhbGwgb2YgdGhlc2UgZXZlbnRzIGFyZSBiZWluZyBhZGRlZCB3aXRoaW4gdGhlIGA8cm9vdD5gIHpvbmUgc2luY2UgdGhleSBhbGxcbiAgICAgIC8vIGRvbid0IGRvIGFueSB2aWV3IHVwZGF0ZXMgYW5kIGRvbid0IHJlcXVpcmUgQW5ndWxhciBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAgICAvLyBBbGwgZXZlbnQgbGlzdGVuZXJzIGNhbGwgYGNhbmNlbERyYWdgIG9uY2UgdGhlIGV2ZW50IGlzIGRpc3BhdGNoZWQsIHRoZSBgY2FuY2VsRHJhZ2BcbiAgICAgIC8vIGlzIHJlc3BvbnNpYmxlIG9ubHkgZm9yIHJlbW92aW5nIGV2ZW50IGxpc3RlbmVycy5cblxuICAgICAgY29uc3QgY2FuY2VsTW91c2UgPSB0aGlzLmdyaWRzdGVySXRlbS5yZW5kZXJlci5saXN0ZW4oXG4gICAgICAgICdkb2N1bWVudCcsXG4gICAgICAgICdtb3VzZXVwJyxcbiAgICAgICAgY2FuY2VsRHJhZ1xuICAgICAgKTtcbiAgICAgIGNvbnN0IGNhbmNlbE1vdXNlTGVhdmUgPSB0aGlzLmdyaWRzdGVySXRlbS5yZW5kZXJlci5saXN0ZW4oXG4gICAgICAgICdkb2N1bWVudCcsXG4gICAgICAgICdtb3VzZWxlYXZlJyxcbiAgICAgICAgY2FuY2VsRHJhZ1xuICAgICAgKTtcbiAgICAgIGNvbnN0IGNhbmNlbE9uQmx1ciA9IHRoaXMuZ3JpZHN0ZXJJdGVtLnJlbmRlcmVyLmxpc3RlbihcbiAgICAgICAgJ3dpbmRvdycsXG4gICAgICAgICdibHVyJyxcbiAgICAgICAgY2FuY2VsRHJhZ1xuICAgICAgKTtcbiAgICAgIGNvbnN0IGNhbmNlbFRvdWNoTW92ZSA9IHRoaXMuZ3JpZHN0ZXJJdGVtLnJlbmRlcmVyLmxpc3RlbihcbiAgICAgICAgJ2RvY3VtZW50JyxcbiAgICAgICAgJ3RvdWNobW92ZScsXG4gICAgICAgIGNhbmNlbE1vdmVcbiAgICAgICk7XG4gICAgICBjb25zdCBjYW5jZWxUb3VjaEVuZCA9IHRoaXMuZ3JpZHN0ZXJJdGVtLnJlbmRlcmVyLmxpc3RlbihcbiAgICAgICAgJ2RvY3VtZW50JyxcbiAgICAgICAgJ3RvdWNoZW5kJyxcbiAgICAgICAgY2FuY2VsRHJhZ1xuICAgICAgKTtcbiAgICAgIGNvbnN0IGNhbmNlbFRvdWNoQ2FuY2VsID0gdGhpcy5ncmlkc3Rlckl0ZW0ucmVuZGVyZXIubGlzdGVuKFxuICAgICAgICAnZG9jdW1lbnQnLFxuICAgICAgICAndG91Y2hjYW5jZWwnLFxuICAgICAgICBjYW5jZWxEcmFnXG4gICAgICApO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2FuY2VsTW91c2UsXG4gICAgICAgIGNhbmNlbE1vdXNlTGVhdmUsXG4gICAgICAgIGNhbmNlbE9uQmx1cixcbiAgICAgICAgY2FuY2VsVG91Y2hNb3ZlLFxuICAgICAgICBjYW5jZWxUb3VjaEVuZCxcbiAgICAgICAgY2FuY2VsVG91Y2hDYW5jZWxcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBjYW5jZWxNb3ZlKGV2ZW50TW92ZTogTW91c2VFdmVudCk6IHZvaWQge1xuICAgICAgR3JpZHN0ZXJVdGlscy5jaGVja1RvdWNoRXZlbnQoZXZlbnRNb3ZlKTtcbiAgICAgIGlmIChcbiAgICAgICAgTWF0aC5hYnMoZXZlbnRNb3ZlLmNsaWVudFggLSAoZSBhcyBNb3VzZUV2ZW50KS5jbGllbnRYKSA+IDkgfHxcbiAgICAgICAgTWF0aC5hYnMoZXZlbnRNb3ZlLmNsaWVudFkgLSAoZSBhcyBNb3VzZUV2ZW50KS5jbGllbnRZKSA+IDlcbiAgICAgICkge1xuICAgICAgICBjYW5jZWxEcmFnKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2FuY2VsRHJhZygpOiB2b2lkIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgIGNhbmNlbE9uQmx1cigpO1xuICAgICAgY2FuY2VsTW91c2UoKTtcbiAgICAgIGNhbmNlbE1vdXNlTGVhdmUoKTtcbiAgICAgIGNhbmNlbFRvdWNoTW92ZSgpO1xuICAgICAgY2FuY2VsVG91Y2hFbmQoKTtcbiAgICAgIGNhbmNlbFRvdWNoQ2FuY2VsKCk7XG4gICAgfVxuICB9XG5cbiAgc2V0SXRlbVRvcCh0b3A6IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMuZ3JpZHN0ZXIuZ3JpZFJlbmRlcmVyLnNldENlbGxQb3NpdGlvbihcbiAgICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLnJlbmRlcmVyLFxuICAgICAgdGhpcy5ncmlkc3Rlckl0ZW0uZWwsXG4gICAgICB0aGlzLmxlZnQsXG4gICAgICB0b3BcbiAgICApO1xuICB9XG5cbiAgc2V0SXRlbUxlZnQobGVmdDogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5ncmlkc3Rlci5ncmlkUmVuZGVyZXIuc2V0Q2VsbFBvc2l0aW9uKFxuICAgICAgdGhpcy5ncmlkc3Rlckl0ZW0ucmVuZGVyZXIsXG4gICAgICB0aGlzLmdyaWRzdGVySXRlbS5lbCxcbiAgICAgIGxlZnQsXG4gICAgICB0aGlzLnRvcFxuICAgICk7XG4gIH1cblxuICBzZXRJdGVtSGVpZ2h0KGhlaWdodDogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5ncmlkc3Rlckl0ZW0ucmVuZGVyZXIuc2V0U3R5bGUoXG4gICAgICB0aGlzLmdyaWRzdGVySXRlbS5lbCxcbiAgICAgICdoZWlnaHQnLFxuICAgICAgaGVpZ2h0ICsgJ3B4J1xuICAgICk7XG4gIH1cblxuICBzZXRJdGVtV2lkdGgod2lkdGg6IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLnJlbmRlcmVyLnNldFN0eWxlKFxuICAgICAgdGhpcy5ncmlkc3Rlckl0ZW0uZWwsXG4gICAgICAnd2lkdGgnLFxuICAgICAgd2lkdGggKyAncHgnXG4gICAgKTtcbiAgfVxufVxuIl19