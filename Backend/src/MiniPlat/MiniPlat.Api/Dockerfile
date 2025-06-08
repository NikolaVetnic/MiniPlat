FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/MiniPlat/MiniPlat.Api/MiniPlat.Api.csproj", "src/MiniPlat/MiniPlat.Api/"]
COPY ["src/MiniPlat/MiniPlat.Application/MiniPlat.Application.csproj", "src/MiniPlat/MiniPlat.Application/"]
COPY ["src/MiniPlat/MiniPlat.Domain/MiniPlat.Domain.csproj", "src/MiniPlat/MiniPlat.Domain/"]
COPY ["src/MiniPlat/MiniPlat.Infrastructure/MiniPlat.Infrastructure.csproj", "src/MiniPlat/MiniPlat.Infrastructure/"]
RUN dotnet restore "src/MiniPlat/MiniPlat.Api/MiniPlat.Api.csproj"
COPY . .
WORKDIR "/src/src/MiniPlat/MiniPlat.Api"
RUN dotnet build "MiniPlat.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "MiniPlat.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

ENTRYPOINT ["dotnet", "MiniPlat.Api.dll"]