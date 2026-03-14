import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeocodingServicePort, GeocodingResult } from '../../application/ports/geocoding-service.port';
import { NOMINATIM_BASE_URL } from '../config/constants';

interface NominatimAddress {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
}

interface NominatimResponse {
    display_name?: string;
    address?: NominatimAddress;
    lat?: string;
    lon?: string;
}

@Injectable()
export class NominatimGeocodingAdapter implements GeocodingServicePort {
    private readonly logger = new Logger(NominatimGeocodingAdapter.name);
    private readonly baseUrl: string;

    constructor(private readonly configService: ConfigService) {
        this.baseUrl = this.configService.get<string>(NOMINATIM_BASE_URL) || 'https://nominatim.openstreetmap.org/reverse';
    }

    async reverseGeocode(
        latitude: number,
        longitude: number,
    ): Promise<GeocodingResult> {
        const url = `${this.baseUrl}?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&accept-language=es`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'FeedGo-LocationService/1.0',
            },
        });

        if (!response.ok) {
            this.logger.warn(
                `Nominatim respondió con status ${response.status} para lat=${latitude}, lon=${longitude}`,
            );
            return {
                mainAddress: null,
                cityName: null,
                departmentName: null,
                latitude,
                longitude,
            };
        }

        const data: NominatimResponse = await response.json();
        const address = data.address;

        const cityName =
            address?.city ??
            address?.town ??
            address?.village ??
            address?.municipality ??
            null;

        const departmentName = address?.state ?? null;

        let mainAddress: string | null = null;
        if (address?.road) {
            mainAddress = address.house_number
                ? `${address.road} #${address.house_number}`
                : address.road;
        }

        return {
            mainAddress,
            cityName,
            departmentName,
            latitude,
            longitude,
        };
    }
}
