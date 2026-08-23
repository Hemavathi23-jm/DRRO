package com.drro.allocation;

import com.drro.entity.ReliefRequest;
import java.util.List;

/**
 * Contract for all allocation strategy implementations.
 * Primary: GreedyAllocator
 * Baselines: FcfsAllocator, SeverityOnlyAllocator, NearestSourceAllocator
 */
public interface AllocationEngine {

    /**
     * Run allocation for a list of verified relief requests.
     * Creates Allocation + AllocationFactor records in the database.
     *
     * @param requests list of VERIFIED relief requests to allocate for
     * @return number of allocation records created
     */
    int allocate(List<ReliefRequest> requests);

    /** Human-readable name of this strategy */
    String strategyName();
}
