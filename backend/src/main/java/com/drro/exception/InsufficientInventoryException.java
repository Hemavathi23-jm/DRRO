package com.drro.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when an allocation attempt cannot proceed because
 * the requested quantity exceeds available inventory.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class InsufficientInventoryException extends RuntimeException {

    public InsufficientInventoryException(String message) {
        super(message);
    }

    public InsufficientInventoryException(String resourceType, double requested, double available) {
        super(String.format(
                "Insufficient inventory for '%s': requested %.2f but only %.2f available.",
                resourceType, requested, available));
    }
}
