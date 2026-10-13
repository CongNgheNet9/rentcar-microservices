FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["RentCar.Shared/RentCar.Shared.csproj", "RentCar.Shared/"]
COPY ["RentCar.VehicleService/RentCar.VehicleService.csproj", "RentCar.VehicleService/"]
RUN dotnet restore "RentCar.VehicleService/RentCar.VehicleService.csproj"
COPY . .
WORKDIR "/src/RentCar.VehicleService"
RUN dotnet build "RentCar.VehicleService.csproj" -c Release -o /app/build
RUN dotnet publish "RentCar.VehicleService.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 5002
ENV ASPNETCORE_URLS=http://+:5002
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "RentCar.VehicleService.dll"]
