FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["RentCar.Shared/RentCar.Shared.csproj", "RentCar.Shared/"]
COPY ["RentCar.UserService/RentCar.UserService.csproj", "RentCar.UserService/"]
RUN dotnet restore "RentCar.UserService/RentCar.UserService.csproj"
COPY . .
WORKDIR "/src/RentCar.UserService"
RUN dotnet build "RentCar.UserService.csproj" -c Release -o /app/build
RUN dotnet publish "RentCar.UserService.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 5001
ENV ASPNETCORE_URLS=http://+:5001
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "RentCar.UserService.dll"]
