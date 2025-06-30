import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconFilter,
  IconThumbUp,
  IconMapPin,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import {
  Stack,
  Text,
  Loader,
  SegmentedControl,
  TextInput,
  Select,
  Checkbox,
  Button,
} from "@mantine/core";
import { getCurrentLocation } from "../utils/geolocation";
import type { FilterOptions } from "./SearchBar";
import SplitText from "./SplitText";
import "./../styles/SearchBar.css";

interface EnhancedSearchBarProps {
  onSearch: (query: string, filters?: FilterOptions) => void;
}

type SearchStep = "search" | "location" | "filters" | "upvotes" | "ready";

export default function EnhancedSearchBar({
  onSearch,
}: EnhancedSearchBarProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<SearchStep>("search");
  const [isHovered, setIsHovered] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    location: "",
    wifi: false,
    powerOutlet: false,
    seatingCapacity: null,
    noiseLevel: null,
    priceRange: null,
    upvotes: null,
    downvotes: null,
    nearMe: null,
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const handleActivate = () => {
    setIsActive(true);
    setCurrentStep("search");
  };

  const handleClose = () => {
    setIsActive(false);
    setCurrentStep("search");
  };

  const handleFilterChange = (updatedFilters: FilterOptions) => {
    setFilters(updatedFilters);
  };

  const handleGetCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      const position = await getCurrentLocation();
      const updatedFilters = {
        ...filters,
        location: "",
        nearMe: {
          latitude: position.latitude,
          longitude: position.longitude,
          radiusKm: 1,
        },
      };
      setFilters(updatedFilters);
    } catch (error) {
      console.error("Error getting location:", error);
      const updatedFilters = { ...filters, nearMe: null };
      setFilters(updatedFilters);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleStepComplete = (step: SearchStep) => {
    switch (step) {
      case "search":
        setCurrentStep("location");
        break;
      case "location":
        setCurrentStep("filters");
        break;
      case "filters":
        setCurrentStep("upvotes");
        break;
      case "upvotes":
        setCurrentStep("ready");
        break;
    }
  };

  const handleSubmit = () => {
    onSearch(searchQuery, { ...filters });
    // Reset filters and step after search
    setSearchQuery("");
    setFilters({
      location: "",
      wifi: false,
      powerOutlet: false,
      seatingCapacity: null,
      noiseLevel: null,
      priceRange: null,
      upvotes: null,
      downvotes: null,
      nearMe: null,
    });
    handleClose();
  };

  const isSearchComplete = searchQuery.trim().length > 0;
  const isLocationComplete = true; // Location step is always complete now (user can choose "All Locations" or "Near Me")
  const isFiltersComplete = !!(
    filters.wifi ||
    filters.powerOutlet ||
    filters.seatingCapacity ||
    filters.noiseLevel ||
    filters.priceRange
  );
  const isUpvotesComplete = filters.upvotes !== null;

  return (
    <>
      {/* Compact Search Bar */}
      <motion.div
        className="search-bar"
        onClick={handleActivate}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{ cursor: "pointer" }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {!isHovered ? (
            <span style={{ color: "#888", opacity: 0.7 }}>
              Find the best cafes near you!
            </span>
          ) : (
            <SplitText
              text="What are you waiting for?"
              delay={50}
              duration={0.4}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 20 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0}
              rootMargin="0px"
              textAlign="center"
            />
          )}
        </div>

        <button type="button" className="search-button">
          <IconSearch size={16} />
        </button>
      </motion.div>

      {/* Enhanced Search Overlay */}
      <AnimatePresence>
        {isActive && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="search-overlay-backdrop"
              onClick={handleClose}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                zIndex: 9999,
                backdropFilter: "blur(4px)",
              }}
            />

            {/* Search Modal */}
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 10000,
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="search-overlay-modal"
                style={{
                  backgroundColor: "white",
                  borderRadius: "20px",
                  padding: "2rem",
                  width: "min(90vw, 600px)",
                  maxHeight: "80vh",
                  overflowY: "auto",
                  boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "2rem",
                  }}
                >
                  <h2
                    style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600 }}
                  >
                    Find Your Perfect Cafe
                  </h2>
                  <button
                    onClick={handleClose}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "8px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconX size={20} />
                  </button>
                </div>

                {/* Progress Steps */}
                <div
                  style={{ display: "flex", marginBottom: "2rem", gap: "1rem" }}
                >
                  {["search", "location", "filters", "upvotes"].map(
                    (step, index) => (
                      <div
                        key={step}
                        style={{
                          flex: 1,
                          height: "4px",
                          borderRadius: "2px",
                          backgroundColor:
                            step === "search" && isSearchComplete
                              ? "#d74f00"
                              : step === "location" && isLocationComplete
                              ? "#d74f00"
                              : step === "filters" && isFiltersComplete
                              ? "#d74f00"
                              : step === "upvotes" && isUpvotesComplete
                              ? "#d74f00"
                              : currentStep === step
                              ? "#d74f00"
                              : "#e9ecef",
                        }}
                      />
                    )
                  )}
                </div>

                {/* Step Content */}
                <AnimatePresence mode="wait">
                  {currentStep === "search" && (
                    <motion.div
                      key="search"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h3 style={{ marginBottom: "1rem" }}>
                        What type of cafe are you looking for?
                      </h3>
                      <Stack gap="md">
                        <TextInput
                          placeholder="Search cafe names, descriptions, or keywords..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          leftSection={<IconSearch size={16} />}
                          size="md"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && searchQuery.trim()) {
                              handleStepComplete("search");
                            }
                          }}
                        />
                        {isSearchComplete && (
                          <Button
                            onClick={() => handleStepComplete("search")}
                            style={{
                              backgroundColor: "#d74f00",
                              marginTop: "1rem",
                            }}
                            size="md"
                          >
                            Continue to Location
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => handleStepComplete("search")}
                          size="md"
                        >
                          Skip - Browse All Cafes
                        </Button>
                      </Stack>
                    </motion.div>
                  )}

                  {currentStep === "location" && (
                    <motion.div
                      key="location"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h3 style={{ marginBottom: "1rem" }}>
                        Where would you like to find cafes?
                      </h3>
                      <Stack gap="md">
                        <SegmentedControl
                          data={[
                            { label: "All Locations", value: "all" },
                            { label: "Near Me", value: "nearMe" },
                          ]}
                          value={filters.nearMe ? "nearMe" : "all"}
                          onChange={(value) => {
                            if (value === "all") {
                              handleFilterChange({ ...filters, nearMe: null });
                            } else {
                              handleGetCurrentLocation();
                            }
                          }}
                          disabled={isLoadingLocation}
                          fullWidth
                        />
                        {isLoadingLocation && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <Loader size="xs" />
                            <Text size="sm">Getting your location...</Text>
                          </div>
                        )}
                        {filters.nearMe && (
                          <Select
                            label="Search Radius"
                            value={filters.nearMe.radiusKm.toString()}
                            onChange={(value) => {
                              if (value && filters.nearMe) {
                                handleFilterChange({
                                  ...filters,
                                  nearMe: {
                                    ...filters.nearMe!,
                                    radiusKm: parseInt(value, 10),
                                  },
                                });
                              }
                            }}
                            data={[
                              { value: "1", label: "1 km" },
                              { value: "5", label: "5 km" },
                              { value: "10", label: "10 km" },
                              { value: "20", label: "20 km" },
                            ]}
                            size="md"
                            comboboxProps={{ zIndex: 10001 }}
                          />
                        )}
                        <div
                          style={{
                            display: "flex",
                            gap: "1rem",
                            marginTop: "1rem",
                          }}
                        >
                          <Button
                            variant="outline"
                            onClick={() => setCurrentStep("search")}
                            style={{ flex: 1 }}
                          >
                            Back
                          </Button>
                          <Button
                            onClick={() => handleStepComplete("location")}
                            style={{ backgroundColor: "#d74f00", flex: 2 }}
                            size="md"
                          >
                            Continue to Filters
                          </Button>
                        </div>
                      </Stack>
                    </motion.div>
                  )}

                  {currentStep === "filters" && (
                    <motion.div
                      key="filters"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h3 style={{ marginBottom: "1rem" }}>
                        What amenities are important to you?
                      </h3>
                      <Stack gap="md">
                        <Checkbox
                          label="WiFi Available"
                          checked={!!filters.wifi}
                          onChange={(e) =>
                            handleFilterChange({
                              ...filters,
                              wifi: e.target.checked,
                            })
                          }
                          size="md"
                        />
                        <Checkbox
                          label="Power Outlets Available"
                          checked={!!filters.powerOutlet}
                          onChange={(e) =>
                            handleFilterChange({
                              ...filters,
                              powerOutlet: e.target.checked,
                            })
                          }
                          size="md"
                        />
                        <Select
                          label="Seating Capacity"
                          placeholder="Any"
                          value={filters.seatingCapacity?.toString() || ""}
                          onChange={(value) =>
                            handleFilterChange({
                              ...filters,
                              seatingCapacity: value
                                ? parseInt(value, 10)
                                : null,
                            })
                          }
                          data={[
                            { value: "1", label: "1-5 people" },
                            { value: "2", label: "6-10 people" },
                            { value: "3", label: "10+ people" },
                          ]}
                          clearable
                          size="md"
                          comboboxProps={{ zIndex: 10001 }}
                        />
                        <Select
                          label="Noise Level"
                          placeholder="Any"
                          value={filters.noiseLevel || ""}
                          onChange={(value) =>
                            handleFilterChange({
                              ...filters,
                              noiseLevel: value || null,
                            })
                          }
                          data={[
                            { value: "quiet", label: "Quiet" },
                            { value: "moderate", label: "Moderate" },
                            { value: "loud", label: "Loud" },
                          ]}
                          clearable
                          size="md"
                          comboboxProps={{ zIndex: 10001 }}
                        />
                        <Select
                          label="Price Range"
                          placeholder="Any"
                          value={filters.priceRange || ""}
                          onChange={(value) =>
                            handleFilterChange({
                              ...filters,
                              priceRange: value || null,
                            })
                          }
                          data={[
                            { value: "$", label: "$" },
                            { value: "$$", label: "$$" },
                            { value: "$$$", label: "$$$" },
                            { value: "$$$$", label: "$$$$" },
                          ]}
                          clearable
                          size="md"
                          comboboxProps={{ zIndex: 10001 }}
                        />
                        <div
                          style={{
                            display: "flex",
                            gap: "1rem",
                            marginTop: "1rem",
                          }}
                        >
                          <Button
                            variant="outline"
                            onClick={() => setCurrentStep("location")}
                            style={{ flex: 1 }}
                          >
                            Back
                          </Button>
                          <Button
                            onClick={() => handleStepComplete("filters")}
                            style={{ backgroundColor: "#d74f00", flex: 2 }}
                          >
                            Continue to Ratings
                          </Button>
                        </div>
                      </Stack>
                    </motion.div>
                  )}

                  {currentStep === "upvotes" && (
                    <motion.div
                      key="upvotes"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h3 style={{ marginBottom: "1rem" }}>
                        How popular should the cafes be?
                      </h3>
                      <Stack gap="md">
                        <Select
                          label="Minimum Upvotes"
                          placeholder="Any (optional)"
                          value={filters.upvotes?.toString() || ""}
                          onChange={(value) =>
                            handleFilterChange({
                              ...filters,
                              upvotes: value ? parseInt(value, 10) : null,
                            })
                          }
                          data={[
                            { value: "10", label: "10+" },
                            { value: "25", label: "25+" },
                            { value: "50", label: "50+" },
                            { value: "100", label: "100+" },
                          ]}
                          clearable
                          size="md"
                          comboboxProps={{ zIndex: 10001 }}
                        />
                        <div
                          style={{
                            display: "flex",
                            gap: "1rem",
                            marginTop: "1rem",
                          }}
                        >
                          <Button
                            variant="outline"
                            onClick={() => setCurrentStep("filters")}
                            style={{ flex: 1 }}
                          >
                            Back
                          </Button>
                          <Button
                            onClick={() => handleStepComplete("upvotes")}
                            style={{ backgroundColor: "#d74f00", flex: 2 }}
                          >
                            Ready to Search
                          </Button>
                        </div>
                      </Stack>
                    </motion.div>
                  )}

                  {currentStep === "ready" && (
                    <motion.div
                      key="ready"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <div style={{ textAlign: "center" }}>
                        <h3 style={{ marginBottom: "1rem" }}>
                          Ready to find your perfect cafe!
                        </h3>
                        <p style={{ color: "#666", marginBottom: "2rem" }}>
                          We'll search for cafes that match your preferences.
                        </p>
                        <div style={{ display: "flex", gap: "1rem" }}>
                          <Button
                            variant="outline"
                            onClick={() => setCurrentStep("upvotes")}
                            style={{ flex: 1 }}
                          >
                            Back
                          </Button>
                          <Button
                            onClick={handleSubmit}
                            style={{ backgroundColor: "#d74f00", flex: 2 }}
                            size="md"
                            leftSection={<IconSearch size={16} />}
                          >
                            Search Cafes
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
