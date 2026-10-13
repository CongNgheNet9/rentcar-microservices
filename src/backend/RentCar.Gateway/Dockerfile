FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["RentCar.Gateway/RentCar.Gateway.csproj", "RentCar.Gateway/"]
RUN dotnet restore "RentCar.Gateway/RentCar.Gateway.csproj"
COPY . .
WORKDIR "/src/RentCar.Gateway"
RUN dotnet build "RentCar.Gateway.csproj" -c Release -o /app/build
RUN dotnet publish "RentCar.Gateway.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "RentCar.Gateway.dll"]
