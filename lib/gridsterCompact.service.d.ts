import { GridsterComponentInterface } from './gridster.interface';
import { GridsterItem } from './gridsterItem.interface';
export declare class GridsterCompact {
    private gridster;
    constructor(gridster: GridsterComponentInterface);
    destroy(): void;
    checkCompact(): void;
    checkCompactItem(item: GridsterItem): void;
    private checkCompactMovement;
    private moveTillCollision;
}
