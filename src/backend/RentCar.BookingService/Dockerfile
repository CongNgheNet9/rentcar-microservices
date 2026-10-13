FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["RentCar.Shared/RentCar.Shared.csproj", "RentCar.Shared/"]
COPY ["RentCar.BookingService/RentCar.BookingService.csproj", "RentCar.BookingService/"]
RUN dotnet restore "RentCar.BookingService/RentCar.BookingService.csproj"
COPY . .
WORKDIR "/src/RentCar.BookingService"
RUN dotnet build "RentCar.BookingService.csproj" -c Release -o /app/build
RUN dotnet publish "RentCar.BookingService.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 5003
ENV ASPNETCORE_URLS=http://+:5003
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "RentCar.BookingService.dll"]
