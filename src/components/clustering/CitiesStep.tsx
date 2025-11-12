import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { City, RUSSIAN_CITIES } from '@/data/russian-cities';
import { toast } from 'sonner';

interface CitiesStepProps {
  selectedCities: City[];
  citySearch: string;
  setCitySearch: (search: string) => void;
  addCity: (city: City) => void;
  removeCity: (cityId: number) => void;
  onNext: () => void;
  onBack: () => void;
  hasManualKeywords?: boolean;
  manualKeyword?: string;
  specificAddress?: string;
  setSpecificAddress?: (address: string) => void;
}

export default function CitiesStep({
  selectedCities,
  citySearch,
  setCitySearch,
  addCity,
  removeCity,
  onNext,
  onBack,
  hasManualKeywords = false,
  manualKeyword = '',
  specificAddress = '',
  setSpecificAddress
}: CitiesStepProps) {
  const [regions, setRegions] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    setIsLoading(true);
    try {
      setRegions(RUSSIAN_CITIES);
    } catch (error) {
      console.error('Failed to load regions:', error);
      toast.error('Не удалось загрузить регионы');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCities = regions.filter(city => 
    city.name.toLowerCase().includes(citySearch.toLowerCase()) &&
    !selectedCities.find(c => c.id === city.id)
  );

  return (
    <Card className="border-slate-200 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-br from-slate-50 to-white">
        <CardTitle className="text-2xl text-slate-800">Сбор ключей</CardTitle>
        <CardDescription className="text-slate-500">
          Выберите регионы для сегментации запросов
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
            <p className="text-sm text-slate-500">Загрузка регионов из Wordstat...</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="city-search" className="text-slate-700">Добавить регион</Label>
              <Input
                id="city-search"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Начните вводить название региона..."
                className="border-slate-200 focus:ring-emerald-500 focus:border-emerald-500"
              />
              
              {citySearch && (
                <div className="mt-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {filteredCities.slice(0, 10).map(city => (
                    <div
                      key={city.id}
                      onClick={() => addCity(city)}
                      className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="font-medium text-slate-800">{city.name}</div>
                      {city.region && (
                        <div className="text-xs text-slate-500 mt-0.5">{city.region}</div>
                      )}
                      {city.population && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          {(city.population / 1000000).toFixed(1)} млн чел.
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredCities.length === 0 && (
                    <div className="p-4 text-center text-slate-500">Регион не найден</div>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label className="text-slate-700 mb-2 block">Выбранные регионы ({selectedCities.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedCities.map(city => (
                  <Badge 
                    key={city.id} 
                    variant="secondary"
                    className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5"
                  >
                    {city.name}
                    <button
                      onClick={() => removeCity(city.id)}
                      className="ml-2 hover:text-emerald-900 transition-colors"
                    >
                      <Icon name="X" className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {selectedCities.length === 0 && (
                <p className="text-sm text-slate-500 mt-2">Выберите хотя бы один регион</p>
              )}
            </div>


          </>
        )}

        <div className="flex gap-3">
          <Button 
            onClick={onBack}
            variant="outline"
            className="flex-1 border-slate-200 hover:bg-slate-50"
          >
            <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
            Назад
          </Button>
          <Button 
            onClick={onNext}
            disabled={selectedCities.length === 0}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            Далее
            <Icon name="ArrowRight" className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}