import { DirTypes } from './gridsterConfig.interface';
import { GridsterPush } from './gridsterPush.service';
import { cancelScroll, scroll } from './gridsterScroll.service';
import { GridsterSwap } from './gridsterSwap.service';
import { GridsterUtils } from './gridsterUtils.service';
const GRIDSTER_ITEM_RESIZABLE_HANDLER_CLASS = 'gridster-item-resizable-handler';
var Direction;
(function (Direction) {
    Direction["UP"] = "UP";
    Direction["DOWN"] = "DOWN";
    Direction["LEFT"] = "LEFT";
    Direction["RIGHT"] = "RIGHT";
})(Direction || (Direction = {}));
export class GridsterDraggable {
    constructor(gridsterItem, gridster, zone) {
        this.zone = zone;
        this.collision = false;
        this.dragMove = (e) => {
            e.stopPropagation();
            e.preventDefault();
            GridsterUtils.checkTouchEvent(e);
            // get the directions of the mouse event
            let directions = this.getDirections(e);
            if (this.gridster.options.enableBoundaryControl) {
                // prevent moving up at the top of gridster
                if (directions.includes(Direction.UP) &&
                    this.gridsterItem.el.getBoundingClientRect().top <=
                        this.gridster.el.getBoundingClientRect().top + this.margin) {
                    directions = directions.filter(direction => direction != Direction.UP);
                    e = new MouseEvent(e.type, {
                        clientX: e.clientX,
                        clientY: this.lastMouse.clientY
                    });
                }
                // prevent moving left at the leftmost column of gridster
                if (directions.includes(Direction.LEFT) &&
                    this.gridsterItem.el.getBoundingClientRect().left <=
                        this.gridster.el.getBoundingClientRect().left + this.margin) {
                    directions = directions.filter(direction => direction != Direction.LEFT);
                    e = new MouseEvent(e.type, {
                        clientX: this.lastMouse.clientX,
                        clientY: e.clientY
                    });
                }
                // prevent moving right at the rightmost column of gridster
                if (directions.includes(Direction.RIGHT) &&
                    this.gridsterItem.el.getBoundingClientRect().right >=
                        this.gridster.el.getBoundingClientRect().right - this.margin) {
                    directions = directions.filter(direction => direction != Direction.RIGHT);
                    e = new MouseEvent(e.type, {
                        clientX: this.lastMouse.clientX,
                        clientY: e.clientY
                    });
                }
                // prevent moving down at the bottom of gridster
                if (directions.includes(Direction.DOWN) &&
                    this.gridsterItem.el.getBoundingClientRect().bottom >=
                        this.gridster.el.getBoundingClientRect().bottom - this.margin) {
                    directions = directions.filter(direction => direction != Direction.DOWN);
                    e = new MouseEvent(e.type, {
                        clientX: e.clientX,
                        clientY: this.lastMouse.clientY
                    });
                }
            }
            // do not change item location when there is no direction to go
            if (directions.length) {
                this.offsetLeft =
                    this.gridster.el.scrollLeft - this.gridster.el.offsetLeft;
                this.offsetTop = this.gridster.el.scrollTop - this.gridster.el.offsetTop;
                scroll(this.gridster, this.left, this.top, this.width, this.height, e, this.lastMouse, this.calculateItemPositionFromMousePosition);
                this.calculateItemPositionFromMousePosition(e);
                // callback
                this.dragMoveCb(e);
            }
        };
        this.calculateItemPositionFromMousePosition = (e) => {
            if (this.gridster.options.scale) {
                this.calculateItemPositionWithScale(e, this.gridster.options.scale);
            }
            else {
                this.calculateItemPositionWithoutScale(e);
            }
            this.calculateItemPosition();
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
            this.cancelOnBlur();
            this.mousemove();
            this.mouseup();
            this.mouseleave();
            this.touchmove();
            this.touchend();
            this.touchcancel();
            this.gridsterItem.renderer.removeClass(this.gridsterItem.el, 'gridster-item-moving');
            this.gridster.dragInProgress = false;
            this.gridster.updateGrid();
            this.path = [];
            if (this.gridster.options.draggable &&
                this.gridster.options.draggable.stop) {
                Promise.resolve(this.gridster.options.draggable.stop(this.gridsterItem.item, this.gridsterItem, e)).then(this.makeDrag, this.cancelDrag);
            }
            else {
                this.makeDrag();
            }
            setTimeout(() => {
                if (this.gridster) {
                    this.gridster.movingItem = null;
                    this.gridster.previewStyle(true);
                }
            });
        };
        this.cancelDrag = () => {
            this.gridsterItem.$item.x = this.gridsterItem.item.x || 0;
            this.gridsterItem.$item.y = this.gridsterItem.item.y || 0;
            this.gridsterItem.setSize();
            if (this.push) {
                this.push.restoreItems();
            }
            if (this.swap) {
                this.swap.restoreSwapItem();
            }
            if (this.push) {
                this.push.destroy();
                this.push = null;
            }
            if (this.swap) {
                this.swap.destroy();
                this.swap = null;
            }
        };
        this.makeDrag = () => {
            if (this.gridster.$options.draggable.dropOverItems &&
                this.gridster.options.draggable &&
                this.gridster.options.draggable.dropOverItemsCallback &&
                this.collision &&
                this.collision !== true &&
                this.collision.$item) {
                this.gridster.options.draggable.dropOverItemsCallback(this.gridsterItem.item, this.collision.item, this.gridster);
            }
            this.collision = false;
            this.gridsterItem.setSize();
            this.gridsterItem.checkItemChanges(this.gridsterItem.$item, this.gridsterItem.item);
            if (this.push) {
                this.push.setPushedItems();
            }
            if (this.swap) {
                this.swap.setSwapItem();
            }
            if (this.push) {
                this.push.destroy();
                this.push = null;
            }
            if (this.swap) {
                this.swap.destroy();
                this.swap = null;
            }
        };
        this.dragStartDelay = (e) => {
            const target = e.target;
            if (target.classList.contains(GRIDSTER_ITEM_RESIZABLE_HANDLER_CLASS)) {
                return;
            }
            if (GridsterUtils.checkContentClassForEvent(this.gridster, e)) {
                return;
            }
            GridsterUtils.checkTouchEvent(e);
            if (!this.gridster.$options.draggable.delayStart) {
                this.dragStart(e);
                return;
            }
            const timeout = setTimeout(() => {
                this.dragStart(e);
                cancelDrag();
            }, this.gridster.$options.draggable.delayStart);
            const cancelMouse = this.gridsterItem.renderer.listen('document', 'mouseup', cancelDrag);
            const cancelMouseLeave = this.gridsterItem.renderer.listen('document', 'mouseleave', cancelDrag);
            const cancelOnBlur = this.gridsterItem.renderer.listen('window', 'blur', cancelDrag);
            const cancelTouchMove = this.gridsterItem.renderer.listen('document', 'touchmove', cancelMove);
            const cancelTouchEnd = this.gridsterItem.renderer.listen('document', 'touchend', cancelDrag);
            const cancelTouchCancel = this.gridsterItem.renderer.listen('document', 'touchcancel', cancelDrag);
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
        };
        this.gridsterItem = gridsterItem;
        this.gridster = gridster;
        this.lastMouse = {
            clientX: 0,
            clientY: 0
        };
        this.path = [];
    }
    destroy() {
        if (this.gridster.previewStyle) {
            this.gridster.previewStyle(true);
        }
        this.gridsterItem = this.gridster = this.collision = null;
        if (this.mousedown) {
            this.mousedown();
            this.touchstart();
        }
    }
    dragStart(e) {
        if (e.which && e.which !== 1) {
            return;
        }
        if (this.gridster.options.draggable &&
            this.gridster.options.draggable.start) {
            this.gridster.options.draggable.start(this.gridsterItem.item, this.gridsterItem, e);
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
        this.gridsterItem.renderer.addClass(this.gridsterItem.el, 'gridster-item-moving');
        this.margin = this.gridster.$options.margin;
        this.offsetLeft = this.gridster.el.scrollLeft - this.gridster.el.offsetLeft;
        this.offsetTop = this.gridster.el.scrollTop - this.gridster.el.offsetTop;
        this.left = this.gridsterItem.left - this.margin;
        this.top = this.gridsterItem.top - this.margin;
        this.originalClientX = e.clientX;
        this.originalClientY = e.clientY;
        this.width = this.gridsterItem.width;
        this.height = this.gridsterItem.height;
        if (this.gridster.$options.dirType === DirTypes.RTL) {
            this.diffLeft =
                e.clientX - this.gridster.el.scrollWidth + this.gridsterItem.left;
        }
        else {
            this.diffLeft = e.clientX + this.offsetLeft - this.margin - this.left;
        }
        this.diffTop = e.clientY + this.offsetTop - this.margin - this.top;
        this.gridster.movingItem = this.gridsterItem.$item;
        this.gridster.previewStyle(true);
        this.push = new GridsterPush(this.gridsterItem);
        this.swap = new GridsterSwap(this.gridsterItem);
        this.gridster.dragInProgress = true;
        this.gridster.updateGrid();
        this.path.push({
            x: this.gridsterItem.item.x || 0,
            y: this.gridsterItem.item.y || 0
        });
    }
    calculateItemPositionWithScale(e, scale) {
        if (this.gridster.$options.dirType === DirTypes.RTL) {
            this.left =
                this.gridster.el.scrollWidth -
                    this.originalClientX +
                    (e.clientX - this.originalClientX) / scale +
                    this.diffLeft;
        }
        else {
            this.left =
                this.originalClientX +
                    (e.clientX - this.originalClientX) / scale +
                    this.offsetLeft -
                    this.diffLeft;
        }
        this.top =
            this.originalClientY +
                (e.clientY - this.originalClientY) / scale +
                this.offsetTop -
                this.diffTop;
    }
    calculateItemPositionWithoutScale(e) {
        if (this.gridster.$options.dirType === DirTypes.RTL) {
            this.left = this.gridster.el.scrollWidth - e.clientX + this.diffLeft;
        }
        else {
            this.left = e.clientX + this.offsetLeft - this.diffLeft;
        }
        this.top = e.clientY + this.offsetTop - this.diffTop;
    }
    calculateItemPosition() {
        this.gridster.movingItem = this.gridsterItem.$item;
        this.positionX = this.gridster.pixelsToPositionX(this.left, Math.round);
        this.positionY = this.gridster.pixelsToPositionY(this.top, Math.round);
        this.positionXBackup = this.gridsterItem.$item.x;
        this.positionYBackup = this.gridsterItem.$item.y;
        this.gridsterItem.$item.x = this.positionX;
        if (this.gridster.checkGridCollision(this.gridsterItem.$item)) {
            this.gridsterItem.$item.x = this.positionXBackup;
        }
        this.gridsterItem.$item.y = this.positionY;
        if (this.gridster.checkGridCollision(this.gridsterItem.$item)) {
            this.gridsterItem.$item.y = this.positionYBackup;
        }
        this.gridster.gridRenderer.setCellPosition(this.gridsterItem.renderer, this.gridsterItem.el, this.left, this.top);
        if (this.positionXBackup !== this.gridsterItem.$item.x ||
            this.positionYBackup !== this.gridsterItem.$item.y) {
            const lastPosition = this.path[this.path.length - 1];
            let direction = '';
            if (lastPosition.x < this.gridsterItem.$item.x) {
                direction = this.push.fromWest;
            }
            else if (lastPosition.x > this.gridsterItem.$item.x) {
                direction = this.push.fromEast;
            }
            else if (lastPosition.y < this.gridsterItem.$item.y) {
                direction = this.push.fromNorth;
            }
            else if (lastPosition.y > this.gridsterItem.$item.y) {
                direction = this.push.fromSouth;
            }
            this.push.pushItems(direction, this.gridster.$options.disablePushOnDrag);
            this.swap.swapItems();
            this.collision = this.gridster.checkCollision(this.gridsterItem.$item);
            if (this.collision) {
                this.gridsterItem.$item.x = this.positionXBackup;
                this.gridsterItem.$item.y = this.positionYBackup;
                if (this.gridster.$options.draggable.dropOverItems &&
                    this.collision !== true &&
                    this.collision.$item) {
                    this.gridster.movingItem = null;
                }
            }
            else {
                this.path.push({
                    x: this.gridsterItem.$item.x,
                    y: this.gridsterItem.$item.y
                });
            }
            this.push.checkPushBack();
        }
        else {
            // reset the collision when you drag and drop on an adjacent cell that is not empty
            // and go back to the cell you were in from the beginning,
            // this is to prevent `dropOverItemsCallback'
            this.collision = false;
        }
        this.gridster.previewStyle(true);
    }
    toggle() {
        const enableDrag = this.gridsterItem.canBeDragged();
        if (!this.enabled && enableDrag) {
            this.enabled = !this.enabled;
            this.mousedown = this.gridsterItem.renderer.listen(this.gridsterItem.el, 'mousedown', this.dragStartDelay);
            this.touchstart = this.gridsterItem.renderer.listen(this.gridsterItem.el, 'touchstart', this.dragStartDelay);
        }
        else if (this.enabled && !enableDrag) {
            this.enabled = !this.enabled;
            this.mousedown();
            this.touchstart();
        }
    }
    /**
     * Returns the list of directions for given mouse event
     * @param e Mouse event
     * */
    getDirections(e) {
        const directions = [];
        if (this.lastMouse.clientX === 0 && this.lastMouse.clientY === 0) {
            this.lastMouse.clientY = e.clientY;
            this.lastMouse.clientX = e.clientY;
        }
        if (this.lastMouse.clientY > e.clientY) {
            directions.push(Direction.UP);
        }
        if (this.lastMouse.clientY < e.clientY) {
            directions.push(Direction.DOWN);
        }
        if (this.lastMouse.clientX < e.clientX) {
            directions.push(Direction.RIGHT);
        }
        if (this.lastMouse.clientX > e.clientX) {
            directions.push(Direction.LEFT);
        }
        return directions;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZHN0ZXJEcmFnZ2FibGUuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2FuZ3VsYXItZ3JpZHN0ZXIyL3NyYy9saWIvZ3JpZHN0ZXJEcmFnZ2FibGUuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFFdEQsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBQ3RELE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFFaEUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBQ3RELE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUV4RCxNQUFNLHFDQUFxQyxHQUFHLGlDQUFpQyxDQUFDO0FBRWhGLElBQUssU0FLSjtBQUxELFdBQUssU0FBUztJQUNaLHNCQUFTLENBQUE7SUFDVCwwQkFBYSxDQUFBO0lBQ2IsMEJBQWEsQ0FBQTtJQUNiLDRCQUFlLENBQUE7QUFDakIsQ0FBQyxFQUxJLFNBQVMsS0FBVCxTQUFTLFFBS2I7QUFFRCxNQUFNLE9BQU8saUJBQWlCO0lBcUM1QixZQUNFLFlBQTRDLEVBQzVDLFFBQW9DLEVBQzVCLElBQVk7UUFBWixTQUFJLEdBQUosSUFBSSxDQUFRO1FBTHRCLGNBQVMsR0FBNkMsS0FBSyxDQUFDO1FBcUg1RCxhQUFRLEdBQUcsQ0FBQyxDQUFhLEVBQVEsRUFBRTtZQUNqQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDcEIsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ25CLGFBQWEsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFakMsd0NBQXdDO1lBQ3hDLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFdkMs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LENBQUMsQ0FBQyxPQUFPLEVBQUU7WUFDdEMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDL0I7UUFDRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUU7WUFDdEMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDakM7UUFDRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUU7WUFDdEMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDbEM7UUFDRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUU7WUFDdEMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDakM7UUFDRCxPQUFPLFVBQVUsQ0FBQztJQUNwQixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZ1pvbmUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEdyaWRzdGVyQ29tcG9uZW50SW50ZXJmYWNlIH0gZnJvbSAnLi9ncmlkc3Rlci5pbnRlcmZhY2UnO1xuaW1wb3J0IHsgRGlyVHlwZXMgfSBmcm9tICcuL2dyaWRzdGVyQ29uZmlnLmludGVyZmFjZSc7XG5pbXBvcnQgeyBHcmlkc3Rlckl0ZW1Db21wb25lbnRJbnRlcmZhY2UgfSBmcm9tICcuL2dyaWRzdGVySXRlbS5pbnRlcmZhY2UnO1xuaW1wb3J0IHsgR3JpZHN0ZXJQdXNoIH0gZnJvbSAnLi9ncmlkc3RlclB1c2guc2VydmljZSc7XG5pbXBvcnQgeyBjYW5jZWxTY3JvbGwsIHNjcm9sbCB9IGZyb20gJy4vZ3JpZHN0ZXJTY3JvbGwuc2VydmljZSc7XG5cbmltcG9ydCB7IEdyaWRzdGVyU3dhcCB9IGZyb20gJy4vZ3JpZHN0ZXJTd2FwLnNlcnZpY2UnO1xuaW1wb3J0IHsgR3JpZHN0ZXJVdGlscyB9IGZyb20gJy4vZ3JpZHN0ZXJVdGlscy5zZXJ2aWNlJztcblxuY29uc3QgR1JJRFNURVJfSVRFTV9SRVNJWkFCTEVfSEFORExFUl9DTEFTUyA9ICdncmlkc3Rlci1pdGVtLXJlc2l6YWJsZS1oYW5kbGVyJztcblxuZW51bSBEaXJlY3Rpb24ge1xuICBVUCA9ICdVUCcsXG4gIERPV04gPSAnRE9XTicsXG4gIExFRlQgPSAnTEVGVCcsXG4gIFJJR0hUID0gJ1JJR0hUJ1xufVxuXG5leHBvcnQgY2xhc3MgR3JpZHN0ZXJEcmFnZ2FibGUge1xuICBncmlkc3Rlckl0ZW06IEdyaWRzdGVySXRlbUNvbXBvbmVudEludGVyZmFjZTtcbiAgZ3JpZHN0ZXI6IEdyaWRzdGVyQ29tcG9uZW50SW50ZXJmYWNlO1xuICBsYXN0TW91c2U6IHtcbiAgICBjbGllbnRYOiBudW1iZXI7XG4gICAgY2xpZW50WTogbnVtYmVyO1xuICB9O1xuICBvZmZzZXRMZWZ0OiBudW1iZXI7XG4gIG9mZnNldFRvcDogbnVtYmVyO1xuICBtYXJnaW46IG51bWJlcjtcbiAgZGlmZlRvcDogbnVtYmVyO1xuICBkaWZmTGVmdDogbnVtYmVyO1xuICBvcmlnaW5hbENsaWVudFg6IG51bWJlcjtcbiAgb3JpZ2luYWxDbGllbnRZOiBudW1iZXI7XG4gIHRvcDogbnVtYmVyO1xuICBsZWZ0OiBudW1iZXI7XG4gIGhlaWdodDogbnVtYmVyO1xuICB3aWR0aDogbnVtYmVyO1xuICBwb3NpdGlvblg6IG51bWJlcjtcbiAgcG9zaXRpb25ZOiBudW1iZXI7XG4gIHBvc2l0aW9uWEJhY2t1cDogbnVtYmVyO1xuICBwb3NpdGlvbllCYWNrdXA6IG51bWJlcjtcbiAgZW5hYmxlZDogYm9vbGVhbjtcbiAgbW91c2Vtb3ZlOiAoKSA9PiB2b2lkO1xuICBtb3VzZXVwOiAoKSA9PiB2b2lkO1xuICBtb3VzZWxlYXZlOiAoKSA9PiB2b2lkO1xuICBjYW5jZWxPbkJsdXI6ICgpID0+IHZvaWQ7XG4gIHRvdWNobW92ZTogKCkgPT4gdm9pZDtcbiAgdG91Y2hlbmQ6ICgpID0+IHZvaWQ7XG4gIHRvdWNoY2FuY2VsOiAoKSA9PiB2b2lkO1xuICBtb3VzZWRvd246ICgpID0+IHZvaWQ7XG4gIHRvdWNoc3RhcnQ6ICgpID0+IHZvaWQ7XG4gIHB1c2g6IEdyaWRzdGVyUHVzaDtcbiAgc3dhcDogR3JpZHN0ZXJTd2FwO1xuICBwYXRoOiBBcnJheTx7IHg6IG51bWJlcjsgeTogbnVtYmVyIH0+O1xuICBjb2xsaXNpb246IEdyaWRzdGVySXRlbUNvbXBvbmVudEludGVyZmFjZSB8IGJvb2xlYW4gPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBncmlkc3Rlckl0ZW06IEdyaWRzdGVySXRlbUNvbXBvbmVudEludGVyZmFjZSxcbiAgICBncmlkc3RlcjogR3JpZHN0ZXJDb21wb25lbnRJbnRlcmZhY2UsXG4gICAgcHJpdmF0ZSB6b25lOiBOZ1pvbmVcbiAgKSB7XG4gICAgdGhpcy5ncmlkc3Rlckl0ZW0gPSBncmlkc3Rlckl0ZW07XG4gICAgdGhpcy5ncmlkc3RlciA9IGdyaWRzdGVyO1xuICAgIHRoaXMubGFzdE1vdXNlID0ge1xuICAgICAgY2xpZW50WDogMCxcbiAgICAgIGNsaWVudFk6IDBcbiAgICB9O1xuICAgIHRoaXMucGF0aCA9IFtdO1xuICB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5ncmlkc3Rlci5wcmV2aWV3U3R5bGUpIHtcbiAgICAgIHRoaXMuZ3JpZHN0ZXIucHJldmlld1N0eWxlKHRydWUpO1xuICAgIH1cbiAgICB0aGlzLmdyaWRzdGVySXRlbSA9IHRoaXMuZ3JpZHN0ZXIgPSB0aGlzLmNvbGxpc2lvbiA9IG51bGwhO1xuICAgIGlmICh0aGlzLm1vdXNlZG93bikge1xuICAgICAgdGhpcy5tb3VzZWRvd24oKTtcbiAgICAgIHRoaXMudG91Y2hzdGFydCgpO1xuICAgIH1cbiAgfVxuXG4gIGRyYWdTdGFydChlOiBNb3VzZUV2ZW50KTogdm9pZCB7XG4gICAgaWYgKGUud2hpY2ggJiYgZS53aGljaCAhPT0gMSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIHRoaXMuZ3JpZHN0ZXIub3B0aW9ucy5kcmFnZ2FibGUgJiZcbiAgICAgIHRoaXMuZ3JpZHN0ZXIub3B0aW9ucy5kcmFnZ2FibGUuc3RhcnRcbiAgICApIHtcbiAgICAgIHRoaXMuZ3JpZHN0ZXIub3B0aW9ucy5kcmFnZ2FibGUuc3RhcnQoXG4gICAgICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLml0ZW0sXG4gICAgICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLFxuICAgICAgICBlXG4gICAgICApO1xuICAgIH1cblxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgdGhpcy56b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHRoaXMubW91c2Vtb3ZlID0gdGhpcy5ncmlkc3Rlckl0ZW0ucmVuZGVyZXIubGlzdGVuKFxuICAgICAgICAnZG9jdW1lbnQnLFxuICAgICAgICAnbW91c2Vtb3ZlJyxcbiAgICAgICAgdGhpcy5kcmFnTW92ZVxuICAgICAgKTtcbiAgICAgIHRoaXMudG91Y2htb3ZlID0gdGhpcy5ncmlkc3Rlci5yZW5kZXJlci5saXN0ZW4oXG4gICAgICAgIHRoaXMuZ3JpZHN0ZXIuZWwsXG4gICAgICAgICd0b3VjaG1vdmUnLFxuICAgICAgICB0aGlzLmRyYWdNb3ZlXG4gICAgICApO1xuICAgIH0pO1xuICAgIHRoaXMubW91c2V1cCA9IHRoaXMuZ3JpZHN0ZXJJdGVtLnJlbmRlcmVyLmxpc3RlbihcbiAgICAgICdkb2N1bWVudCcsXG4gICAgICAnbW91c2V1cCcsXG4gICAgICB0aGlzLmRyYWdTdG9wXG4gICAgKTtcbiAgICB0aGlzLm1vdXNlbGVhdmUgPSB0aGlzLmdyaWRzdGVySXRlbS5yZW5kZXJlci5saXN0ZW4oXG4gICAgICAnZG9jdW1lbnQnLFxuICAgICAgJ21vdXNlbGVhdmUnLFxuICAgICAgdGhpcy5kcmFnU3RvcFxuICAgICk7XG4gICAgdGhpcy5jYW5jZWxPbkJsdXIgPSB0aGlzLmdyaWRzdGVySXRlbS5yZW5kZXJlci5saXN0ZW4oXG4gICAgICAnd2luZG93JyxcbiAgICAgICdibHVyJyxcbiAgICAgIHRoaXMuZHJhZ1N0b3BcbiAgICApO1xuICAgIHRoaXMudG91Y2hlbmQgPSB0aGlzLmdyaWRzdGVySXRlbS5yZW5kZXJlci5saXN0ZW4oXG4gICAgICAnZG9jdW1lbnQnLFxuICAgICAgJ3RvdWNoZW5kJyxcbiAgICAgIHRoaXMuZHJhZ1N0b3BcbiAgICApO1xuICAgIHRoaXMudG91Y2hjYW5jZWwgPSB0aGlzLmdyaWRzdGVySXRlbS5yZW5kZXJlci5saXN0ZW4oXG4gICAgICAnZG9jdW1lbnQnLFxuICAgICAgJ3RvdWNoY2FuY2VsJyxcbiAgICAgIHRoaXMuZHJhZ1N0b3BcbiAgICApO1xuICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLnJlbmRlcmVyLmFkZENsYXNzKFxuICAgICAgdGhpcy5ncmlkc3Rlckl0ZW0uZWwsXG4gICAgICAnZ3JpZHN0ZXItaXRlbS1tb3ZpbmcnXG4gICAgKTtcbiAgICB0aGlzLm1hcmdpbiA9IHRoaXMuZ3JpZHN0ZXIuJG9wdGlvbnMubWFyZ2luO1xuICAgIHRoaXMub2Zmc2V0TGVmdCA9IHRoaXMuZ3JpZHN0ZXIuZWwuc2Nyb2xsTGVmdCAtIHRoaXMuZ3JpZHN0ZXIuZWwub2Zmc2V0TGVmdDtcbiAgICB0aGlzLm9mZnNldFRvcCA9IHRoaXMuZ3JpZHN0ZXIuZWwuc2Nyb2xsVG9wIC0gdGhpcy5ncmlkc3Rlci5lbC5vZmZzZXRUb3A7XG4gICAgdGhpcy5sZWZ0ID0gdGhpcy5ncmlkc3Rlckl0ZW0ubGVmdCAtIHRoaXMubWFyZ2luO1xuICAgIHRoaXMudG9wID0gdGhpcy5ncmlkc3Rlckl0ZW0udG9wIC0gdGhpcy5tYXJnaW47XG4gICAgdGhpcy5vcmlnaW5hbENsaWVudFggPSBlLmNsaWVudFg7XG4gICAgdGhpcy5vcmlnaW5hbENsaWVudFkgPSBlLmNsaWVudFk7XG4gICAgdGhpcy53aWR0aCA9IHRoaXMuZ3JpZHN0ZXJJdGVtLndpZHRoO1xuICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy5ncmlkc3Rlckl0ZW0uaGVpZ2h0O1xuICAgIGlmICh0aGlzLmdyaWRzdGVyLiRvcHRpb25zLmRpclR5cGUgPT09IERpclR5cGVzLlJUTCkge1xuICAgICAgdGhpcy5kaWZmTGVmdCA9XG4gICAgICAgIGUuY2xpZW50WCAtIHRoaXMuZ3JpZHN0ZXIuZWwuc2Nyb2xsV2lkdGggKyB0aGlzLmdyaWRzdGVySXRlbS5sZWZ0O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRpZmZMZWZ0ID0gZS5jbGllbnRYICsgdGhpcy5vZmZzZXRMZWZ0IC0gdGhpcy5tYXJnaW4gLSB0aGlzLmxlZnQ7XG4gICAgfVxuICAgIHRoaXMuZGlmZlRvcCA9IGUuY2xpZW50WSArIHRoaXMub2Zmc2V0VG9wIC0gdGhpcy5tYXJnaW4gLSB0aGlzLnRvcDtcbiAgICB0aGlzLmdyaWRzdGVyLm1vdmluZ0l0ZW0gPSB0aGlzLmdyaWRzdGVySXRlbS4kaXRlbTtcbiAgICB0aGlzLmdyaWRzdGVyLnByZXZpZXdTdHlsZSh0cnVlKTtcbiAgICB0aGlzLnB1c2ggPSBuZXcgR3JpZHN0ZXJQdXNoKHRoaXMuZ3JpZHN0ZXJJdGVtKTtcbiAgICB0aGlzLnN3YXAgPSBuZXcgR3JpZHN0ZXJTd2FwKHRoaXMuZ3JpZHN0ZXJJdGVtKTtcbiAgICB0aGlzLmdyaWRzdGVyLmRyYWdJblByb2dyZXNzID0gdHJ1ZTtcbiAgICB0aGlzLmdyaWRzdGVyLnVwZGF0ZUdyaWQoKTtcbiAgICB0aGlzLnBhdGgucHVzaCh7XG4gICAgICB4OiB0aGlzLmdyaWRzdGVySXRlbS5pdGVtLnggfHwgMCxcbiAgICAgIHk6IHRoaXMuZ3JpZHN0ZXJJdGVtLml0ZW0ueSB8fCAwXG4gICAgfSk7XG4gIH1cblxuICBkcmFnTW92ZUNiOiAoZTogTW91c2VFdmVudCkgPT4gdm9pZDtcblxuICBkcmFnTW92ZSA9IChlOiBNb3VzZUV2ZW50KTogdm9pZCA9PiB7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgR3JpZHN0ZXJVdGlscy5jaGVja1RvdWNoRXZlbnQoZSk7XG5cbiAgICAvLyBnZXQgdGhlIGRpcmVjdGlvbnMgb2YgdGhlIG1vdXNlIGV2ZW50XG4gICAgbGV0IGRpcmVjdGlvbnMgPSB0aGlzLmdldERpcmVjdGlvbnMoZSk7XG5cbiAgICBpZiAodGhpcy5ncmlkc3Rlci5vcHRpb25zLmVuYWJsZUJvdW5kYXJ5Q29udHJvbCkge1xuICAgICAgLy8gcHJldmVudCBtb3ZpbmcgdXAgYXQgdGhlIHRvcCBvZiBncmlkc3RlclxuICAgICAgaWYgKFxuICAgICAgICBkaXJlY3Rpb25zLmluY2x1ZGVzKERpcmVjdGlvbi5VUCkgJiZcbiAgICAgICAgdGhpcy5ncmlkc3Rlckl0ZW0uZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wIDw9XG4gICAgICAgICAgdGhpcy5ncmlkc3Rlci5lbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgKyB0aGlzLm1hcmdpblxuICAgICAgKSB7XG4gICAgICAgIGRpcmVjdGlvbnMgPSBkaXJlY3Rpb25zLmZpbHRlcihkaXJlY3Rpb24gPT4gZGlyZWN0aW9uICE9IERpcmVjdGlvbi5VUCk7XG4gICAgICAgIGUgPSBuZXcgTW91c2VFdmVudChlLnR5cGUsIHtcbiAgICAgICAgICBjbGllbnRYOiBlLmNsaWVudFgsXG4gICAgICAgICAgY2xpZW50WTogdGhpcy5sYXN0TW91c2UuY2xpZW50WVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIC8vIHByZXZlbnQgbW92aW5nIGxlZnQgYXQgdGhlIGxlZnRtb3N0IGNvbHVtbiBvZiBncmlkc3RlclxuICAgICAgaWYgKFxuICAgICAgICBkaXJlY3Rpb25zLmluY2x1ZGVzKERpcmVjdGlvbi5MRUZUKSAmJlxuICAgICAgICB0aGlzLmdyaWRzdGVySXRlbS5lbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0IDw9XG4gICAgICAgICAgdGhpcy5ncmlkc3Rlci5lbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0ICsgdGhpcy5tYXJnaW5cbiAgICAgICkge1xuICAgICAgICBkaXJlY3Rpb25zID0gZGlyZWN0aW9ucy5maWx0ZXIoXG4gICAgICAgICAgZGlyZWN0aW9uID0+IGRpcmVjdGlvbiAhPSBEaXJlY3Rpb24uTEVGVFxuICAgICAgICApO1xuICAgICAgICBlID0gbmV3IE1vdXNlRXZlbnQoZS50eXBlLCB7XG4gICAgICAgICAgY2xpZW50WDogdGhpcy5sYXN0TW91c2UuY2xpZW50WCxcbiAgICAgICAgICBjbGllbnRZOiBlLmNsaWVudFlcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAvLyBwcmV2ZW50IG1vdmluZyByaWdodCBhdCB0aGUgcmlnaHRtb3N0IGNvbHVtbiBvZiBncmlkc3RlclxuICAgICAgaWYgKFxuICAgICAgICBkaXJlY3Rpb25zLmluY2x1ZGVzKERpcmVjdGlvbi5SSUdIVCkgJiZcbiAgICAgICAgdGhpcy5ncmlkc3Rlckl0ZW0uZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkucmlnaHQgPj1cbiAgICAgICAgICB0aGlzLmdyaWRzdGVyLmVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnJpZ2h0IC0gdGhpcy5tYXJnaW5cbiAgICAgICkge1xuICAgICAgICBkaXJlY3Rpb25zID0gZGlyZWN0aW9ucy5maWx0ZXIoXG4gICAgICAgICAgZGlyZWN0aW9uID0+IGRpcmVjdGlvbiAhPSBEaXJlY3Rpb24uUklHSFRcbiAgICAgICAgKTtcbiAgICAgICAgZSA9IG5ldyBNb3VzZUV2ZW50KGUudHlwZSwge1xuICAgICAgICAgIGNsaWVudFg6IHRoaXMubGFzdE1vdXNlLmNsaWVudFgsXG4gICAgICAgICAgY2xpZW50WTogZS5jbGllbnRZXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgLy8gcHJldmVudCBtb3ZpbmcgZG93biBhdCB0aGUgYm90dG9tIG9mIGdyaWRzdGVyXG4gICAgICBpZiAoXG4gICAgICAgIGRpcmVjdGlvbnMuaW5jbHVkZXMoRGlyZWN0aW9uLkRPV04pICYmXG4gICAgICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLmVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmJvdHRvbSA+PVxuICAgICAgICAgIHRoaXMuZ3JpZHN0ZXIuZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuYm90dG9tIC0gdGhpcy5tYXJnaW5cbiAgICAgICkge1xuICAgICAgICBkaXJlY3Rpb25zID0gZGlyZWN0aW9ucy5maWx0ZXIoXG4gICAgICAgICAgZGlyZWN0aW9uID0+IGRpcmVjdGlvbiAhPSBEaXJlY3Rpb24uRE9XTlxuICAgICAgICApO1xuICAgICAgICBlID0gbmV3IE1vdXNlRXZlbnQoZS50eXBlLCB7XG4gICAgICAgICAgY2xpZW50WDogZS5jbGllbnRYLFxuICAgICAgICAgIGNsaWVudFk6IHRoaXMubGFzdE1vdXNlLmNsaWVudFlcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gZG8gbm90IGNoYW5nZSBpdGVtIGxvY2F0aW9uIHdoZW4gdGhlcmUgaXMgbm8gZGlyZWN0aW9uIHRvIGdvXG4gICAgaWYgKGRpcmVjdGlvbnMubGVuZ3RoKSB7XG4gICAgICB0aGlzLm9mZnNldExlZnQgPVxuICAgICAgICB0aGlzLmdyaWRzdGVyLmVsLnNjcm9sbExlZnQgLSB0aGlzLmdyaWRzdGVyLmVsLm9mZnNldExlZnQ7XG4gICAgICB0aGlzLm9mZnNldFRvcCA9IHRoaXMuZ3JpZHN0ZXIuZWwuc2Nyb2xsVG9wIC0gdGhpcy5ncmlkc3Rlci5lbC5vZmZzZXRUb3A7XG4gICAgICBzY3JvbGwoXG4gICAgICAgIHRoaXMuZ3JpZHN0ZXIsXG4gICAgICAgIHRoaXMubGVmdCxcbiAgICAgICAgdGhpcy50b3AsXG4gICAgICAgIHRoaXMud2lkdGgsXG4gICAgICAgIHRoaXMuaGVpZ2h0LFxuICAgICAgICBlLFxuICAgICAgICB0aGlzLmxhc3RNb3VzZSxcbiAgICAgICAgdGhpcy5jYWxjdWxhdGVJdGVtUG9zaXRpb25Gcm9tTW91c2VQb3NpdGlvblxuICAgICAgKTtcblxuICAgICAgdGhpcy5jYWxjdWxhdGVJdGVtUG9zaXRpb25Gcm9tTW91c2VQb3NpdGlvbihlKTtcbiAgICAgIC8vIGNhbGxiYWNrXG4gICAgICB0aGlzLmRyYWdNb3ZlQ2IoZSk7XG4gICAgfVxuICB9O1xuXG4gIGNhbGN1bGF0ZUl0ZW1Qb3NpdGlvbkZyb21Nb3VzZVBvc2l0aW9uID0gKGU6IE1vdXNlRXZlbnQpOiB2b2lkID0+IHtcbiAgICBpZiAodGhpcy5ncmlkc3Rlci5vcHRpb25zLnNjYWxlKSB7XG4gICAgICB0aGlzLmNhbGN1bGF0ZUl0ZW1Qb3NpdGlvbldpdGhTY2FsZShlLCB0aGlzLmdyaWRzdGVyLm9wdGlvbnMuc2NhbGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNhbGN1bGF0ZUl0ZW1Qb3NpdGlvbldpdGhvdXRTY2FsZShlKTtcbiAgICB9XG4gICAgdGhpcy5jYWxjdWxhdGVJdGVtUG9zaXRpb24oKTtcbiAgICB0aGlzLmxhc3RNb3VzZS5jbGllbnRYID0gZS5jbGllbnRYO1xuICAgIHRoaXMubGFzdE1vdXNlLmNsaWVudFkgPSBlLmNsaWVudFk7XG4gICAgdGhpcy56b25lLnJ1bigoKSA9PiB7XG4gICAgICB0aGlzLmdyaWRzdGVyLnVwZGF0ZUdyaWQoKTtcbiAgICB9KTtcbiAgfTtcblxuICBjYWxjdWxhdGVJdGVtUG9zaXRpb25XaXRoU2NhbGUoZTogTW91c2VFdmVudCwgc2NhbGU6IG51bWJlcik6IHZvaWQge1xuICAgIGlmICh0aGlzLmdyaWRzdGVyLiRvcHRpb25zLmRpclR5cGUgPT09IERpclR5cGVzLlJUTCkge1xuICAgICAgdGhpcy5sZWZ0ID1cbiAgICAgICAgdGhpcy5ncmlkc3Rlci5lbC5zY3JvbGxXaWR0aCAtXG4gICAgICAgIHRoaXMub3JpZ2luYWxDbGllbnRYICtcbiAgICAgICAgKGUuY2xpZW50WCAtIHRoaXMub3JpZ2luYWxDbGllbnRYKSAvIHNjYWxlICtcbiAgICAgICAgdGhpcy5kaWZmTGVmdDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5sZWZ0ID1cbiAgICAgICAgdGhpcy5vcmlnaW5hbENsaWVudFggK1xuICAgICAgICAoZS5jbGllbnRYIC0gdGhpcy5vcmlnaW5hbENsaWVudFgpIC8gc2NhbGUgK1xuICAgICAgICB0aGlzLm9mZnNldExlZnQgLVxuICAgICAgICB0aGlzLmRpZmZMZWZ0O1xuICAgIH1cbiAgICB0aGlzLnRvcCA9XG4gICAgICB0aGlzLm9yaWdpbmFsQ2xpZW50WSArXG4gICAgICAoZS5jbGllbnRZIC0gdGhpcy5vcmlnaW5hbENsaWVudFkpIC8gc2NhbGUgK1xuICAgICAgdGhpcy5vZmZzZXRUb3AgLVxuICAgICAgdGhpcy5kaWZmVG9wO1xuICB9XG5cbiAgY2FsY3VsYXRlSXRlbVBvc2l0aW9uV2l0aG91dFNjYWxlKGU6IE1vdXNlRXZlbnQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5ncmlkc3Rlci4kb3B0aW9ucy5kaXJUeXBlID09PSBEaXJUeXBlcy5SVEwpIHtcbiAgICAgIHRoaXMubGVmdCA9IHRoaXMuZ3JpZHN0ZXIuZWwuc2Nyb2xsV2lkdGggLSBlLmNsaWVudFggKyB0aGlzLmRpZmZMZWZ0O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmxlZnQgPSBlLmNsaWVudFggKyB0aGlzLm9mZnNldExlZnQgLSB0aGlzLmRpZmZMZWZ0O1xuICAgIH1cblxuICAgIHRoaXMudG9wID0gZS5jbGllbnRZICsgdGhpcy5vZmZzZXRUb3AgLSB0aGlzLmRpZmZUb3A7XG4gIH1cblxuICBkcmFnU3RvcCA9IChlOiBNb3VzZUV2ZW50KTogdm9pZCA9PiB7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICBjYW5jZWxTY3JvbGwoKTtcbiAgICB0aGlzLmNhbmNlbE9uQmx1cigpO1xuICAgIHRoaXMubW91c2Vtb3ZlKCk7XG4gICAgdGhpcy5tb3VzZXVwKCk7XG4gICAgdGhpcy5tb3VzZWxlYXZlKCk7XG4gICAgdGhpcy50b3VjaG1vdmUoKTtcbiAgICB0aGlzLnRvdWNoZW5kKCk7XG4gICAgdGhpcy50b3VjaGNhbmNlbCgpO1xuICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLnJlbmRlcmVyLnJlbW92ZUNsYXNzKFxuICAgICAgdGhpcy5ncmlkc3Rlckl0ZW0uZWwsXG4gICAgICAnZ3JpZHN0ZXItaXRlbS1tb3ZpbmcnXG4gICAgKTtcbiAgICB0aGlzLmdyaWRzdGVyLmRyYWdJblByb2dyZXNzID0gZmFsc2U7XG4gICAgdGhpcy5ncmlkc3Rlci51cGRhdGVHcmlkKCk7XG4gICAgdGhpcy5wYXRoID0gW107XG4gICAgaWYgKFxuICAgICAgdGhpcy5ncmlkc3Rlci5vcHRpb25zLmRyYWdnYWJsZSAmJlxuICAgICAgdGhpcy5ncmlkc3Rlci5vcHRpb25zLmRyYWdnYWJsZS5zdG9wXG4gICAgKSB7XG4gICAgICBQcm9taXNlLnJlc29sdmUoXG4gICAgICAgIHRoaXMuZ3JpZHN0ZXIub3B0aW9ucy5kcmFnZ2FibGUuc3RvcChcbiAgICAgICAgICB0aGlzLmdyaWRzdGVySXRlbS5pdGVtLFxuICAgICAgICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLFxuICAgICAgICAgIGVcbiAgICAgICAgKVxuICAgICAgKS50aGVuKHRoaXMubWFrZURyYWcsIHRoaXMuY2FuY2VsRHJhZyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubWFrZURyYWcoKTtcbiAgICB9XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBpZiAodGhpcy5ncmlkc3Rlcikge1xuICAgICAgICB0aGlzLmdyaWRzdGVyLm1vdmluZ0l0ZW0gPSBudWxsO1xuICAgICAgICB0aGlzLmdyaWRzdGVyLnByZXZpZXdTdHlsZSh0cnVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICBjYW5jZWxEcmFnID0gKCk6IHZvaWQgPT4ge1xuICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLnggPSB0aGlzLmdyaWRzdGVySXRlbS5pdGVtLnggfHwgMDtcbiAgICB0aGlzLmdyaWRzdGVySXRlbS4kaXRlbS55ID0gdGhpcy5ncmlkc3Rlckl0ZW0uaXRlbS55IHx8IDA7XG4gICAgdGhpcy5ncmlkc3Rlckl0ZW0uc2V0U2l6ZSgpO1xuICAgIGlmICh0aGlzLnB1c2gpIHtcbiAgICAgIHRoaXMucHVzaC5yZXN0b3JlSXRlbXMoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc3dhcCkge1xuICAgICAgdGhpcy5zd2FwLnJlc3RvcmVTd2FwSXRlbSgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5wdXNoKSB7XG4gICAgICB0aGlzLnB1c2guZGVzdHJveSgpO1xuICAgICAgdGhpcy5wdXNoID0gbnVsbCE7XG4gICAgfVxuICAgIGlmICh0aGlzLnN3YXApIHtcbiAgICAgIHRoaXMuc3dhcC5kZXN0cm95KCk7XG4gICAgICB0aGlzLnN3YXAgPSBudWxsITtcbiAgICB9XG4gIH07XG5cbiAgbWFrZURyYWcgPSAoKTogdm9pZCA9PiB7XG4gICAgaWYgKFxuICAgICAgdGhpcy5ncmlkc3Rlci4kb3B0aW9ucy5kcmFnZ2FibGUuZHJvcE92ZXJJdGVtcyAmJlxuICAgICAgdGhpcy5ncmlkc3Rlci5vcHRpb25zLmRyYWdnYWJsZSAmJlxuICAgICAgdGhpcy5ncmlkc3Rlci5vcHRpb25zLmRyYWdnYWJsZS5kcm9wT3Zlckl0ZW1zQ2FsbGJhY2sgJiZcbiAgICAgIHRoaXMuY29sbGlzaW9uICYmXG4gICAgICB0aGlzLmNvbGxpc2lvbiAhPT0gdHJ1ZSAmJlxuICAgICAgdGhpcy5jb2xsaXNpb24uJGl0ZW1cbiAgICApIHtcbiAgICAgIHRoaXMuZ3JpZHN0ZXIub3B0aW9ucy5kcmFnZ2FibGUuZHJvcE92ZXJJdGVtc0NhbGxiYWNrKFxuICAgICAgICB0aGlzLmdyaWRzdGVySXRlbS5pdGVtLFxuICAgICAgICB0aGlzLmNvbGxpc2lvbi5pdGVtLFxuICAgICAgICB0aGlzLmdyaWRzdGVyXG4gICAgICApO1xuICAgIH1cbiAgICB0aGlzLmNvbGxpc2lvbiA9IGZhbHNlO1xuICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLnNldFNpemUoKTtcbiAgICB0aGlzLmdyaWRzdGVySXRlbS5jaGVja0l0ZW1DaGFuZ2VzKFxuICAgICAgdGhpcy5ncmlkc3Rlckl0ZW0uJGl0ZW0sXG4gICAgICB0aGlzLmdyaWRzdGVySXRlbS5pdGVtXG4gICAgKTtcbiAgICBpZiAodGhpcy5wdXNoKSB7XG4gICAgICB0aGlzLnB1c2guc2V0UHVzaGVkSXRlbXMoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc3dhcCkge1xuICAgICAgdGhpcy5zd2FwLnNldFN3YXBJdGVtKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnB1c2gpIHtcbiAgICAgIHRoaXMucHVzaC5kZXN0cm95KCk7XG4gICAgICB0aGlzLnB1c2ggPSBudWxsITtcbiAgICB9XG4gICAgaWYgKHRoaXMuc3dhcCkge1xuICAgICAgdGhpcy5zd2FwLmRlc3Ryb3koKTtcbiAgICAgIHRoaXMuc3dhcCA9IG51bGwhO1xuICAgIH1cbiAgfTtcblxuICBjYWxjdWxhdGVJdGVtUG9zaXRpb24oKTogdm9pZCB7XG4gICAgdGhpcy5ncmlkc3Rlci5tb3ZpbmdJdGVtID0gdGhpcy5ncmlkc3Rlckl0ZW0uJGl0ZW07XG4gICAgdGhpcy5wb3NpdGlvblggPSB0aGlzLmdyaWRzdGVyLnBpeGVsc1RvUG9zaXRpb25YKHRoaXMubGVmdCwgTWF0aC5yb3VuZCk7XG4gICAgdGhpcy5wb3NpdGlvblkgPSB0aGlzLmdyaWRzdGVyLnBpeGVsc1RvUG9zaXRpb25ZKHRoaXMudG9wLCBNYXRoLnJvdW5kKTtcbiAgICB0aGlzLnBvc2l0aW9uWEJhY2t1cCA9IHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLng7XG4gICAgdGhpcy5wb3NpdGlvbllCYWNrdXAgPSB0aGlzLmdyaWRzdGVySXRlbS4kaXRlbS55O1xuICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLnggPSB0aGlzLnBvc2l0aW9uWDtcbiAgICBpZiAodGhpcy5ncmlkc3Rlci5jaGVja0dyaWRDb2xsaXNpb24odGhpcy5ncmlkc3Rlckl0ZW0uJGl0ZW0pKSB7XG4gICAgICB0aGlzLmdyaWRzdGVySXRlbS4kaXRlbS54ID0gdGhpcy5wb3NpdGlvblhCYWNrdXA7XG4gICAgfVxuICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLnkgPSB0aGlzLnBvc2l0aW9uWTtcbiAgICBpZiAodGhpcy5ncmlkc3Rlci5jaGVja0dyaWRDb2xsaXNpb24odGhpcy5ncmlkc3Rlckl0ZW0uJGl0ZW0pKSB7XG4gICAgICB0aGlzLmdyaWRzdGVySXRlbS4kaXRlbS55ID0gdGhpcy5wb3NpdGlvbllCYWNrdXA7XG4gICAgfVxuICAgIHRoaXMuZ3JpZHN0ZXIuZ3JpZFJlbmRlcmVyLnNldENlbGxQb3NpdGlvbihcbiAgICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLnJlbmRlcmVyLFxuICAgICAgdGhpcy5ncmlkc3Rlckl0ZW0uZWwsXG4gICAgICB0aGlzLmxlZnQsXG4gICAgICB0aGlzLnRvcFxuICAgICk7XG5cbiAgICBpZiAoXG4gICAgICB0aGlzLnBvc2l0aW9uWEJhY2t1cCAhPT0gdGhpcy5ncmlkc3Rlckl0ZW0uJGl0ZW0ueCB8fFxuICAgICAgdGhpcy5wb3NpdGlvbllCYWNrdXAgIT09IHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLnlcbiAgICApIHtcbiAgICAgIGNvbnN0IGxhc3RQb3NpdGlvbiA9IHRoaXMucGF0aFt0aGlzLnBhdGgubGVuZ3RoIC0gMV07XG4gICAgICBsZXQgZGlyZWN0aW9uID0gJyc7XG4gICAgICBpZiAobGFzdFBvc2l0aW9uLnggPCB0aGlzLmdyaWRzdGVySXRlbS4kaXRlbS54KSB7XG4gICAgICAgIGRpcmVjdGlvbiA9IHRoaXMucHVzaC5mcm9tV2VzdDtcbiAgICAgIH0gZWxzZSBpZiAobGFzdFBvc2l0aW9uLnggPiB0aGlzLmdyaWRzdGVySXRlbS4kaXRlbS54KSB7XG4gICAgICAgIGRpcmVjdGlvbiA9IHRoaXMucHVzaC5mcm9tRWFzdDtcbiAgICAgIH0gZWxzZSBpZiAobGFzdFBvc2l0aW9uLnkgPCB0aGlzLmdyaWRzdGVySXRlbS4kaXRlbS55KSB7XG4gICAgICAgIGRpcmVjdGlvbiA9IHRoaXMucHVzaC5mcm9tTm9ydGg7XG4gICAgICB9IGVsc2UgaWYgKGxhc3RQb3NpdGlvbi55ID4gdGhpcy5ncmlkc3Rlckl0ZW0uJGl0ZW0ueSkge1xuICAgICAgICBkaXJlY3Rpb24gPSB0aGlzLnB1c2guZnJvbVNvdXRoO1xuICAgICAgfVxuICAgICAgdGhpcy5wdXNoLnB1c2hJdGVtcyhkaXJlY3Rpb24sIHRoaXMuZ3JpZHN0ZXIuJG9wdGlvbnMuZGlzYWJsZVB1c2hPbkRyYWcpO1xuICAgICAgdGhpcy5zd2FwLnN3YXBJdGVtcygpO1xuICAgICAgdGhpcy5jb2xsaXNpb24gPSB0aGlzLmdyaWRzdGVyLmNoZWNrQ29sbGlzaW9uKHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtKTtcbiAgICAgIGlmICh0aGlzLmNvbGxpc2lvbikge1xuICAgICAgICB0aGlzLmdyaWRzdGVySXRlbS4kaXRlbS54ID0gdGhpcy5wb3NpdGlvblhCYWNrdXA7XG4gICAgICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLnkgPSB0aGlzLnBvc2l0aW9uWUJhY2t1cDtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHRoaXMuZ3JpZHN0ZXIuJG9wdGlvbnMuZHJhZ2dhYmxlLmRyb3BPdmVySXRlbXMgJiZcbiAgICAgICAgICB0aGlzLmNvbGxpc2lvbiAhPT0gdHJ1ZSAmJlxuICAgICAgICAgIHRoaXMuY29sbGlzaW9uLiRpdGVtXG4gICAgICAgICkge1xuICAgICAgICAgIHRoaXMuZ3JpZHN0ZXIubW92aW5nSXRlbSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucGF0aC5wdXNoKHtcbiAgICAgICAgICB4OiB0aGlzLmdyaWRzdGVySXRlbS4kaXRlbS54LFxuICAgICAgICAgIHk6IHRoaXMuZ3JpZHN0ZXJJdGVtLiRpdGVtLnlcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICB0aGlzLnB1c2guY2hlY2tQdXNoQmFjaygpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyByZXNldCB0aGUgY29sbGlzaW9uIHdoZW4geW91IGRyYWcgYW5kIGRyb3Agb24gYW4gYWRqYWNlbnQgY2VsbCB0aGF0IGlzIG5vdCBlbXB0eVxuICAgICAgLy8gYW5kIGdvIGJhY2sgdG8gdGhlIGNlbGwgeW91IHdlcmUgaW4gZnJvbSB0aGUgYmVnaW5uaW5nLFxuICAgICAgLy8gdGhpcyBpcyB0byBwcmV2ZW50IGBkcm9wT3Zlckl0ZW1zQ2FsbGJhY2snXG4gICAgICB0aGlzLmNvbGxpc2lvbiA9IGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLmdyaWRzdGVyLnByZXZpZXdTdHlsZSh0cnVlKTtcbiAgfVxuXG4gIHRvZ2dsZSgpOiB2b2lkIHtcbiAgICBjb25zdCBlbmFibGVEcmFnID0gdGhpcy5ncmlkc3Rlckl0ZW0uY2FuQmVEcmFnZ2VkKCk7XG4gICAgaWYgKCF0aGlzLmVuYWJsZWQgJiYgZW5hYmxlRHJhZykge1xuICAgICAgdGhpcy5lbmFibGVkID0gIXRoaXMuZW5hYmxlZDtcbiAgICAgIHRoaXMubW91c2Vkb3duID0gdGhpcy5ncmlkc3Rlckl0ZW0ucmVuZGVyZXIubGlzdGVuKFxuICAgICAgICB0aGlzLmdyaWRzdGVySXRlbS5lbCxcbiAgICAgICAgJ21vdXNlZG93bicsXG4gICAgICAgIHRoaXMuZHJhZ1N0YXJ0RGVsYXlcbiAgICAgICk7XG4gICAgICB0aGlzLnRvdWNoc3RhcnQgPSB0aGlzLmdyaWRzdGVySXRlbS5yZW5kZXJlci5saXN0ZW4oXG4gICAgICAgIHRoaXMuZ3JpZHN0ZXJJdGVtLmVsLFxuICAgICAgICAndG91Y2hzdGFydCcsXG4gICAgICAgIHRoaXMuZHJhZ1N0YXJ0RGVsYXlcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmVuYWJsZWQgJiYgIWVuYWJsZURyYWcpIHtcbiAgICAgIHRoaXMuZW5hYmxlZCA9ICF0aGlzLmVuYWJsZWQ7XG4gICAgICB0aGlzLm1vdXNlZG93bigpO1xuICAgICAgdGhpcy50b3VjaHN0YXJ0KCk7XG4gICAgfVxuICB9XG5cbiAgZHJhZ1N0YXJ0RGVsYXkgPSAoZTogTW91c2VFdmVudCk6IHZvaWQgPT4ge1xuICAgIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50O1xuICAgIGlmICh0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKEdSSURTVEVSX0lURU1fUkVTSVpBQkxFX0hBTkRMRVJfQ0xBU1MpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChHcmlkc3RlclV0aWxzLmNoZWNrQ29udGVudENsYXNzRm9yRXZlbnQodGhpcy5ncmlkc3RlciwgZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgR3JpZHN0ZXJVdGlscy5jaGVja1RvdWNoRXZlbnQoZSk7XG4gICAgaWYgKCF0aGlzLmdyaWRzdGVyLiRvcHRpb25zLmRyYWdnYWJsZS5kZWxheVN0YXJ0KSB7XG4gICAgICB0aGlzLmRyYWdTdGFydChlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5kcmFnU3RhcnQoZSk7XG4gICAgICBjYW5jZWxEcmFnKCk7XG4gICAgfSwgdGhpcy5ncmlkc3Rlci4kb3B0aW9ucy5kcmFnZ2FibGUuZGVsYXlTdGFydCk7XG4gICAgY29uc3QgY2FuY2VsTW91c2UgPSB0aGlzLmdyaWRzdGVySXRlbS5yZW5kZXJlci5saXN0ZW4oXG4gICAgICAnZG9jdW1lbnQnLFxuICAgICAgJ21vdXNldXAnLFxuICAgICAgY2FuY2VsRHJhZ1xuICAgICk7XG4gICAgY29uc3QgY2FuY2VsTW91c2VMZWF2ZSA9IHRoaXMuZ3JpZHN0ZXJJdGVtLnJlbmRlcmVyLmxpc3RlbihcbiAgICAgICdkb2N1bWVudCcsXG4gICAgICAnbW91c2VsZWF2ZScsXG4gICAgICBjYW5jZWxEcmFnXG4gICAgKTtcbiAgICBjb25zdCBjYW5jZWxPbkJsdXIgPSB0aGlzLmdyaWRzdGVySXRlbS5yZW5kZXJlci5saXN0ZW4oXG4gICAgICAnd2luZG93JyxcbiAgICAgICdibHVyJyxcbiAgICAgIGNhbmNlbERyYWdcbiAgICApO1xuICAgIGNvbnN0IGNhbmNlbFRvdWNoTW92ZSA9IHRoaXMuZ3JpZHN0ZXJJdGVtLnJlbmRlcmVyLmxpc3RlbihcbiAgICAgICdkb2N1bWVudCcsXG4gICAgICAndG91Y2htb3ZlJyxcbiAgICAgIGNhbmNlbE1vdmVcbiAgICApO1xuICAgIGNvbnN0IGNhbmNlbFRvdWNoRW5kID0gdGhpcy5ncmlkc3Rlckl0ZW0ucmVuZGVyZXIubGlzdGVuKFxuICAgICAgJ2RvY3VtZW50JyxcbiAgICAgICd0b3VjaGVuZCcsXG4gICAgICBjYW5jZWxEcmFnXG4gICAgKTtcbiAgICBjb25zdCBjYW5jZWxUb3VjaENhbmNlbCA9IHRoaXMuZ3JpZHN0ZXJJdGVtLnJlbmRlcmVyLmxpc3RlbihcbiAgICAgICdkb2N1bWVudCcsXG4gICAgICAndG91Y2hjYW5jZWwnLFxuICAgICAgY2FuY2VsRHJhZ1xuICAgICk7XG5cbiAgICBmdW5jdGlvbiBjYW5jZWxNb3ZlKGV2ZW50TW92ZTogTW91c2VFdmVudCk6IHZvaWQge1xuICAgICAgR3JpZHN0ZXJVdGlscy5jaGVja1RvdWNoRXZlbnQoZXZlbnRNb3ZlKTtcbiAgICAgIGlmIChcbiAgICAgICAgTWF0aC5hYnMoZXZlbnRNb3ZlLmNsaWVudFggLSBlLmNsaWVudFgpID4gOSB8fFxuICAgICAgICBNYXRoLmFicyhldmVudE1vdmUuY2xpZW50WSAtIGUuY2xpZW50WSkgPiA5XG4gICAgICApIHtcbiAgICAgICAgY2FuY2VsRHJhZygpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNhbmNlbERyYWcoKTogdm9pZCB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICBjYW5jZWxPbkJsdXIoKTtcbiAgICAgIGNhbmNlbE1vdXNlKCk7XG4gICAgICBjYW5jZWxNb3VzZUxlYXZlKCk7XG4gICAgICBjYW5jZWxUb3VjaE1vdmUoKTtcbiAgICAgIGNhbmNlbFRvdWNoRW5kKCk7XG4gICAgICBjYW5jZWxUb3VjaENhbmNlbCgpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbGlzdCBvZiBkaXJlY3Rpb25zIGZvciBnaXZlbiBtb3VzZSBldmVudFxuICAgKiBAcGFyYW0gZSBNb3VzZSBldmVudFxuICAgKiAqL1xuICBwcml2YXRlIGdldERpcmVjdGlvbnMoZTogTW91c2VFdmVudCkge1xuICAgIGNvbnN0IGRpcmVjdGlvbnM6IHN0cmluZ1tdID0gW107XG4gICAgIGlmICh0aGlzLmxhc3RNb3VzZS5jbGllbnRYID09PSAwICYmIHRoaXMubGFzdE1vdXNlLmNsaWVudFkgPT09IDApIHtcbiAgICAgIHRoaXMubGFzdE1vdXNlLmNsaWVudFkgPSBlLmNsaWVudFk7XG4gICAgICB0aGlzLmxhc3RNb3VzZS5jbGllbnRYID0gZS5jbGllbnRZO1xuICAgIH1cbiAgICBpZiAodGhpcy5sYXN0TW91c2UuY2xpZW50WSA+IGUuY2xpZW50WSkge1xuICAgICAgZGlyZWN0aW9ucy5wdXNoKERpcmVjdGlvbi5VUCk7XG4gICAgfVxuICAgIGlmICh0aGlzLmxhc3RNb3VzZS5jbGllbnRZIDwgZS5jbGllbnRZKSB7XG4gICAgICBkaXJlY3Rpb25zLnB1c2goRGlyZWN0aW9uLkRPV04pO1xuICAgIH1cbiAgICBpZiAodGhpcy5sYXN0TW91c2UuY2xpZW50WCA8IGUuY2xpZW50WCkge1xuICAgICAgZGlyZWN0aW9ucy5wdXNoKERpcmVjdGlvbi5SSUdIVCk7XG4gICAgfVxuICAgIGlmICh0aGlzLmxhc3RNb3VzZS5jbGllbnRYID4gZS5jbGllbnRYKSB7XG4gICAgICBkaXJlY3Rpb25zLnB1c2goRGlyZWN0aW9uLkxFRlQpO1xuICAgIH1cbiAgICByZXR1cm4gZGlyZWN0aW9ucztcbiAgfVxufVxuIl19