import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStates, getCities } from "@/lib/api";

interface FiltersProps {
  onFiltersChange: (filters: {
    state?: string;
    city?: string;
    status?: string;
  }) => void;
}

export function Filters({ onFiltersChange }: FiltersProps) {
  const [states, setStates] = useState<{ value: string; label: string }[]>([]);
  const [cities, setCities] = useState<{ value: string; label: string }[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  useEffect(() => {
    loadStates();
  }, []);

  useEffect(() => {
    if (selectedState) {
      loadCities(selectedState);
    } else {
      setCities([]);
      setSelectedCity("");
    }
  }, [selectedState]);

  useEffect(() => {
    onFiltersChange({
      state: selectedState && selectedState !== "all" ? selectedState : undefined,
      city: selectedCity && selectedCity !== "all" ? selectedCity : undefined,
      status: selectedStatus && selectedStatus !== "all" ? selectedStatus : undefined,
    });
  }, [selectedState, selectedCity, selectedStatus, onFiltersChange]);

  const loadStates = async () => {
    try {
      const statesData = await getStates();
      setStates(statesData);
    } catch (error) {
      console.error("Failed to load states:", error);
    }
  };

  const loadCities = async (state: string) => {
    try {
      const citiesData = await getCities(state);
      setCities(citiesData);
    } catch (error) {
      console.error("Failed to load cities:", error);
    }
  };

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    setSelectedCity(""); // Reset city when state changes
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Issues</CardTitle>
        <CardDescription>
          Filter issues by location and status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="state-filter">State</Label>
            <Select value={selectedState} onValueChange={handleStateChange}>
              <SelectTrigger data-testid="select-state-filter">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="city-filter">City</Label>
            <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedState}>
              <SelectTrigger data-testid="select-city-filter">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.value} value={city.value}>
                    {city.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status-filter">Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="not-assigned">Not Assigned</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
